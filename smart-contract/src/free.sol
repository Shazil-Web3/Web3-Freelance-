// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract JobAsCrewOne {
    enum JobStatus { Open, InProgress, Completed, Disputed, Resolved }
    enum Resolution { None, ClientWon, FreelancerWon }

    struct Milestone {
        string description;
        uint128 amount; // Gas: Use uint128 for amounts
        bool completed;
        bool paid;
        string workDescription;
    }

    struct Proposal {
        address freelancer;
        string proposal;
        uint128 bidAmount; // Gas: Use uint128
    }

    struct Job {
        address client;
        address freelancer;
        string title;
        uint128 totalAmount; // Gas: Use uint128
        uint128 paidAmount; // Gas: Track paid amounts
        JobStatus status;
        uint256 currentMilestone;
        Resolution resolution;
        uint256 deadline;
        string disputeReason;
        uint256 disputeRaisedAt; // Security: For dispute timeout
        Milestone[] milestones;
        Proposal[] proposals;
    }

    address public owner;
    mapping(address => bool) public disputeResolvers;
    mapping(uint256 => Job) public jobs;
    uint256 public jobCounter;
    uint256 public commissionRate; // Platform commission percentage
    uint256 public platformFees; // Accumulated platform fees
    bool public paused; // Security: Pause mechanism
    uint256 public constant DISPUTE_TIMEOUT = 7 days; // Security: Dispute resolution deadline
    uint256 public constant MAX_MILESTONES = 50; // Security: Limit milestones

    bool private locked; // Security: Reentrancy guard

    modifier onlyOwner() {
        require(msg.sender == owner, "OnlyOwner");
        _;
    }

    modifier onlyClient(uint256 jobId) {
        require(msg.sender == jobs[jobId].client, "OnlyClient");
        _;
    }

    modifier onlyFreelancer(uint256 jobId) {
        require(msg.sender == jobs[jobId].freelancer, "OnlyFreelancer");
        _;
    }

    modifier onlyDisputeResolver() {
        require(disputeResolvers[msg.sender], "NotResolver");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant");
        locked = true;
        _;
        locked = false;
    }

    event JobCreated(uint256 indexed jobId, address client, string title, uint256 amount);
    event ProposalSubmitted(uint256 indexed jobId, address freelancer, string proposal, uint256 bidAmount);
    event FreelancerSelected(uint256 indexed jobId, address freelancer);
    event MilestoneCompleted(uint256 indexed jobId, uint256 milestoneIndex);
    event MilestonePaid(uint256 indexed jobId, uint256 milestoneIndex);
    event JobDisputed(uint256 indexed jobId, string reason);
    event DisputeResolved(uint256 indexed jobId, Resolution resolution);
    event ProjectCancelled(uint256 indexed jobId);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event ContractOwnerUpdated(address newOwner);
    event CommissionUpdated(uint256 percent);
    event DisputeResolverUpdated(address indexed resolver, bool status);
    event Paused(address by);
    event Unpaused(address by);

    constructor() {
        owner = msg.sender;
    }

    // Toggle contract pause state
    function togglePause(bool _paused) external onlyOwner {
        paused = _paused;
        if (_paused) {
            emit Paused(msg.sender);
        } else {
            emit Unpaused(msg.sender);
        }
    }

    // Assign/remove dispute team members
    function assignDisputeResolver(address user, bool status) external onlyOwner {
        require(user != address(0), "InvalidAddress");
        disputeResolvers[user] = status;
        emit DisputeResolverUpdated(user, status);
    }

    // Client creates a job with milestones and pays total upfront
    function createJob(string memory title, Milestone[] memory _milestones, uint256 deadline) external payable whenNotPaused {
        require(_milestones.length > 0 && _milestones.length <= MAX_MILESTONES, "InvalidMilestones");
        require(deadline > block.timestamp, "InvalidDeadline");

        uint128 total = 0; // Gas: Use uint128
        for (uint256 i = 0; i < _milestones.length; i++) {
            require(_milestones[i].amount > 0, "ZeroAmount");
            total += _milestones[i].amount;
        }
        require(msg.value == total, "IncorrectValue");

        uint256 jobId = jobCounter++;
        Job storage job = jobs[jobId];
        job.client = msg.sender;
        job.title = title;
        job.totalAmount = total;
        job.status = JobStatus.Open;
        job.deadline = deadline;

        for (uint256 i = 0; i < _milestones.length; i++) {
            job.milestones.push(_milestones[i]);
        }

        emit JobCreated(jobId, msg.sender, title, total);
    }

    // Freelancer applies to an open job
    function applyToProject(uint256 jobId, string memory proposal, uint128 bidAmount) external whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Open, "NotOpen");
        require(block.timestamp <= job.deadline, "DeadlinePassed");
        require(bidAmount > 0, "InvalidBid");

        job.proposals.push(Proposal(msg.sender, proposal, bidAmount));
        emit ProposalSubmitted(jobId, msg.sender, proposal, bidAmount);
    }

    // Client selects a freelancer from proposals
    function selectFreelancer(uint256 jobId, address freelancer) external onlyClient(jobId) whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Open, "NotOpen");
        require(block.timestamp <= job.deadline, "DeadlinePassed");
        require(freelancer != address(0), "InvalidFreelancer");

        bool validFreelancer = false;
        for (uint256 i = 0; i < job.proposals.length; i++) {
            if (job.proposals[i].freelancer == freelancer) {
                validFreelancer = true;
                break;
            }
        }
        require(validFreelancer, "NotApplied");

        job.freelancer = freelancer;
        job.status = JobStatus.InProgress;
        emit FreelancerSelected(jobId, freelancer);
    }

    // Freelancer marks a milestone as completed
    function completeMilestone(uint256 jobId, string memory workDescription) external onlyFreelancer(jobId) whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.InProgress, "InvalidStatus");
        require(block.timestamp <= job.deadline, "DeadlinePassed");
        require(!job.milestones[job.currentMilestone].completed, "AlreadyCompleted");

        job.milestones[job.currentMilestone].completed = true;
        job.milestones[job.currentMilestone].workDescription = workDescription;
        emit MilestoneCompleted(jobId, job.currentMilestone);
    }

    // Client approves and pays the completed milestone
    function releasePayment(uint256 jobId) external onlyClient(jobId) nonReentrant whenNotPaused {
        Job storage job = jobs[jobId];
        uint256 i = job.currentMilestone;
        require(job.status == JobStatus.InProgress, "InvalidStatus");
        require(job.milestones[i].completed, "NotCompleted");
        require(!job.milestones[i].paid, "AlreadyPaid");

        uint128 fee = (job.milestones[i].amount * uint128(commissionRate)) / 100; // Gas: Cast to uint128
        uint128 payout = job.milestones[i].amount - fee;
        job.milestones[i].paid = true;
        job.paidAmount += job.milestones[i].amount; // Gas: Track paid amount
        platformFees += fee;
        payable(job.freelancer).transfer(payout);

        emit MilestonePaid(jobId, i);

        job.currentMilestone++;
        if (job.currentMilestone == job.milestones.length) {
            job.status = JobStatus.Completed;
        }
    }

    // Either party can raise a dispute
    function raiseDispute(uint256 jobId, string memory reason) external whenNotPaused {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.freelancer, "NotAuthorized");
        require(job.status == JobStatus.InProgress, "InvalidStatus");
        require(bytes(reason).length > 0, "ReasonRequired");

        job.status = JobStatus.Disputed;
        job.disputeReason = reason;
        job.disputeRaisedAt = block.timestamp;

        emit JobDisputed(jobId, reason);
    }

    // Dispute Resolver resolves dispute
    function resolveDispute(uint256 jobId, Resolution decision) external onlyDisputeResolver nonReentrant whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "NotDisputed");
        require(block.timestamp <= job.disputeRaisedAt + DISPUTE_TIMEOUT, "DisputeTimeout");

        job.status = JobStatus.Resolved;
        job.resolution = decision;

        uint128 amount = job.totalAmount - job.paidAmount; // Gas: Use paidAmount
        if (decision == Resolution.ClientWon) {
            payable(job.client).transfer(amount);
        } else if (decision == Resolution.FreelancerWon) {
            payable(job.freelancer).transfer(amount);
        }

        emit DisputeResolved(jobId, decision);
    }

    // Freelancer withdraws all completed earnings
    function withdrawFreelancerEarnings() external nonReentrant whenNotPaused {
        uint128 total = 0; // Gas: Use uint128
        for (uint256 jobId = 0; jobId < jobCounter; jobId++) {
            Job storage job = jobs[jobId];
            if (job.freelancer == msg.sender && job.status == JobStatus.InProgress) {
                for (uint256 i = 0; i < job.milestones.length; i++) {
                    if (job.milestones[i].completed && !job.milestones[i].paid) {
                        uint128 fee = (job.milestones[i].amount * uint128(commissionRate)) / 100; // Gas: Cast to uint128
                        uint128 payout = job.milestones[i].amount - fee;
                        job.milestones[i].paid = true;
                        job.paidAmount += job.milestones[i].amount; // Gas: Track paid amount
                        platformFees += fee;
                        total += payout;
                    }
                }
            }
        }
        require(total > 0, "NoFunds");
        payable(msg.sender).transfer(total);
        emit FundsWithdrawn(msg.sender, total);
    }

    // Client cancels an unstarted project
    function cancelProject(uint256 jobId) external onlyClient(jobId) nonReentrant whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Open, "CannotCancel");
        require(job.currentMilestone == 0, "WorkStarted");

        payable(job.client).transfer(job.totalAmount - job.paidAmount); // Gas: Use paidAmount
        job.status = JobStatus.Resolved;
        emit ProjectCancelled(jobId);
    }

    // Owner updates commission rate
    function updateCommissionRate(uint256 percent) external onlyOwner whenNotPaused {
        require(percent <= 100, "InvalidPercent");
        commissionRate = percent;
        emit CommissionUpdated(percent);
    }

    // Owner withdraws platform fees
    function withdrawPlatformFees() external onlyOwner nonReentrant whenNotPaused {
        uint256 amount = platformFees;
        require(amount > 0, "NoFees");
        platformFees = 0;
        payable(owner).transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }

    // Owner transfers contract ownership
    function setContractOwner(address newOwner) external onlyOwner whenNotPaused {
        require(newOwner != address(0), "InvalidAddress");
        owner = newOwner;
        emit ContractOwnerUpdated(newOwner);
    }

    // Calculate remaining funds for a job
    function remainingFunds(uint256 jobId) public view returns (uint256) {
        Job storage job = jobs[jobId];
        return job.totalAmount - job.paidAmount; // Gas: Use paidAmount
    }

    // Emergency withdraw (by owner)
    function emergencyWithdraw(uint256 jobId) external onlyOwner nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "NotDisputed");
        require(block.timestamp > job.disputeRaisedAt + DISPUTE_TIMEOUT, "DisputeActive");
        uint128 amount = job.totalAmount - job.paidAmount; // Gas: Use paidAmount
        payable(owner).transfer(amount);
        job.status = JobStatus.Resolved;
    }

    receive() external payable whenNotPaused {}
}