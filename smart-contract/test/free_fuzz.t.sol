// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/free.sol";

contract JobAsCrewOneFuzzTest is Test {
    JobAsCrewOne public jobAsCrewOne;
    address public owner = address(0x1);
    address public client = address(0x2);
    address public freelancer = address(0x3);
    address public resolver1 = address(0x4);
    address public resolver2 = address(0x5);

    function setUp() public {
        vm.prank(owner);
        jobAsCrewOne = new JobAsCrewOne();
        vm.deal(owner, 1000 ether);
        vm.deal(client, 1000 ether);
        vm.deal(freelancer, 1000 ether);
        vm.deal(resolver1, 1000 ether);
        vm.deal(resolver2, 1000 ether);
    }

    // Fuzz test for createJob with various milestone configurations
    function testFuzz_CreateJob(
        string memory title,
        uint8 numMilestones,
        uint128[] memory amounts,
        uint256 deadlineOffset
    ) public {
        // Bound inputs to reasonable ranges
        numMilestones = uint8(bound(numMilestones, 1, 10));
        deadlineOffset = bound(deadlineOffset, 1 hours, 365 days);
        
        // Ensure we have enough amounts for the number of milestones
        vm.assume(amounts.length >= numMilestones);
        
        // Create milestones array
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](numMilestones);
        uint128 totalAmount = 0;
        
        for (uint8 i = 0; i < numMilestones; i++) {
            uint128 amount = uint128(bound(amounts[i], 0.001 ether, 10 ether));
            ms[i] = JobAsCrewOne.Milestone(
                string(abi.encodePacked("Milestone ", vm.toString(i))),
                amount,
                false,
                false,
                ""
            );
            totalAmount += amount;
        }
        
        uint256 deadline = block.timestamp + deadlineOffset;
        
        // Ensure client has enough funds
        vm.deal(client, totalAmount + 1 ether);
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: totalAmount}(title, ms, deadline);
        
        // Verify job was created
        (address jobClient, , string memory jobTitle, uint128 jobTotalAmount, , , , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(jobClient, client);
        assertEq(jobTitle, title);
        assertEq(jobTotalAmount, totalAmount);
    }

    // Fuzz test for applyToProject with various bid amounts
    function testFuzz_ApplyToProject(
        uint128 bidAmount,
        string memory proposal,
        uint256 deadlineOffset
    ) public {
        // Create a job first
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        deadlineOffset = bound(deadlineOffset, 1 hours, 30 days);
        uint256 deadline = block.timestamp + deadlineOffset;
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, deadline);
        
        // Bound bid amount to reasonable range
        bidAmount = uint128(bound(bidAmount, 0.001 ether, 5 ether));
        
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, proposal, bidAmount);
        
        // Verify by selecting freelancer
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        
        ( , address jobFreelancer, , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(jobFreelancer, freelancer);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.InProgress));
    }

    // Fuzz test for milestone completion with various work descriptions
    function testFuzz_CompleteMilestone(
        string memory workDescription,
        uint256 timeOffset
    ) public {
        // Create job and setup
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](2);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 0.5 ether, false, false, "");
        ms[1] = JobAsCrewOne.Milestone("Milestone 2", 0.5 ether, false, false, "");
        
        timeOffset = bound(timeOffset, 1 hours, 7 days);
        uint256 deadline = block.timestamp + timeOffset;
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, deadline);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        
        // Complete first milestone
        vm.prank(freelancer);
        jobAsCrewOne.completeMilestone(0, workDescription);
        
        // Verify by releasing payment
        uint256 initialBalance = freelancer.balance;
        vm.prank(client);
        jobAsCrewOne.releasePayment(0);
        
        // Check that payment was released
        assertGt(freelancer.balance, initialBalance);
    }

    // Fuzz test for dispute resolution with various reasons
    function testFuzz_RaiseDispute(
        string memory disputeReason,
        uint256 timeOffset
    ) public {
        // Ensure dispute reason is not empty
        vm.assume(bytes(disputeReason).length > 0);
        
        // Setup job
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        timeOffset = bound(timeOffset, 1 hours, 7 days);
        uint256 deadline = block.timestamp + timeOffset;
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, deadline);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        
        // Setup dispute resolver
        vm.prank(owner);
        jobAsCrewOne.assignDisputeResolver(resolver1, true);
        
        // Raise dispute
        vm.prank(client);
        jobAsCrewOne.raiseDispute(0, disputeReason);
        
        // Verify dispute was raised
        ( , , , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.Disputed));
    }

    // Fuzz test for commission rate updates
    function testFuzz_UpdateCommissionRate(uint8 commissionRate) public {
        // Bound commission rate to valid range
        commissionRate = uint8(bound(commissionRate, 0, 100));
        
        vm.prank(owner);
        jobAsCrewOne.updateCommissionRate(commissionRate);
        
        assertEq(jobAsCrewOne.commissionRate(), commissionRate);
    }

    // Fuzz test for multiple jobs creation
    function testFuzz_MultipleJobs(
        uint8 numJobs,
        uint8 numMilestones,
        uint128[] memory amounts
    ) public {
        numJobs = uint8(bound(numJobs, 1, 5));
        numMilestones = uint8(bound(numMilestones, 1, 5));
        
        vm.assume(amounts.length >= numMilestones);
        
        for (uint8 jobIndex = 0; jobIndex < numJobs; jobIndex++) {
            JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](numMilestones);
            uint128 totalAmount = 0;
            
            for (uint8 i = 0; i < numMilestones; i++) {
                uint128 amount = uint128(bound(amounts[i], 0.001 ether, 2 ether));
                ms[i] = JobAsCrewOne.Milestone(
                    string(abi.encodePacked("Job ", vm.toString(jobIndex), " Milestone ", vm.toString(i))),
                    amount,
                    false,
                    false,
                    ""
                );
                totalAmount += amount;
            }
            
            vm.deal(client, totalAmount + 1 ether);
            vm.prank(client);
            jobAsCrewOne.createJob{value: totalAmount}(
                string(abi.encodePacked("Job ", vm.toString(jobIndex))),
                ms,
                block.timestamp + 7 days
            );
        }
        
        // Verify all jobs were created
        assertEq(jobAsCrewOne.jobCounter(), numJobs);
    }

    // Fuzz test for deadline validation
    function testFuzz_DeadlineValidation(uint256 deadlineOffset) public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        // Test both valid and invalid deadlines
        if (deadlineOffset <= block.timestamp) {
            // Invalid deadline - should revert
            vm.prank(client);
            vm.expectRevert("InvalidDeadline");
            jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, deadlineOffset);
        } else {
            // Valid deadline - should succeed
            vm.prank(client);
            jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, deadlineOffset);
        }
    }

    // Fuzz test for payment amounts validation
    function testFuzz_PaymentAmountValidation(uint128 paymentAmount) public {
        // Bound payment amount to reasonable range
        paymentAmount = uint128(bound(paymentAmount, 0, 100 ether));
        
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        uint256 deadline = block.timestamp + 7 days;
        
        if (paymentAmount != 1 ether) {
            // Incorrect payment amount - should revert
            vm.deal(client, paymentAmount + 1 ether);
            vm.prank(client);
            vm.expectRevert("IncorrectValue");
            jobAsCrewOne.createJob{value: paymentAmount}("Test Job", ms, deadline);
        } else {
            // Correct payment amount - should succeed
            vm.deal(client, paymentAmount + 1 ether);
            vm.prank(client);
            jobAsCrewOne.createJob{value: paymentAmount}("Test Job", ms, deadline);
        }
    }

    // Fuzz test for milestone amount validation
    function testFuzz_MilestoneAmountValidation(uint128 milestoneAmount) public {
        // Bound milestone amount to reasonable range to avoid overflow
        milestoneAmount = uint128(bound(milestoneAmount, 0, 100 ether));
        
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", milestoneAmount, false, false, "");
        
        uint256 deadline = block.timestamp + 7 days;
        
        if (milestoneAmount == 0) {
            // Zero amount - should revert
            vm.prank(client);
            vm.expectRevert("ZeroAmount");
            jobAsCrewOne.createJob{value: milestoneAmount}("Test Job", ms, deadline);
        } else {
            // Valid amount - should succeed
            vm.deal(client, milestoneAmount + 1 ether);
            vm.prank(client);
            jobAsCrewOne.createJob{value: milestoneAmount}("Test Job", ms, deadline);
        }
    }

    // Fuzz test for bid amount validation
    function testFuzz_BidAmountValidation(uint128 bidAmount) public {
        // Create job first
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        
        if (bidAmount == 0) {
            // Zero bid amount - should revert
            vm.prank(freelancer);
            vm.expectRevert("InvalidBid");
            jobAsCrewOne.applyToProject(0, "Proposal", bidAmount);
        } else {
            // Valid bid amount - should succeed
            vm.prank(freelancer);
            jobAsCrewOne.applyToProject(0, "Proposal", bidAmount);
        }
    }

    // Fuzz test for dispute timeout
    function testFuzz_DisputeTimeout(uint256 timeOffset) public {
        // Setup job and dispute
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        
        vm.prank(owner);
        jobAsCrewOne.assignDisputeResolver(resolver1, true);
        
        vm.prank(client);
        jobAsCrewOne.raiseDispute(0, "Dispute reason");
        
        // Time travel
        timeOffset = bound(timeOffset, 0, 10 days);
        vm.warp(block.timestamp + timeOffset);
        
        if (timeOffset > 7 days) {
            // Dispute timeout - should revert
            vm.prank(resolver1);
            vm.expectRevert("DisputeTimeout");
            jobAsCrewOne.resolveDispute(0, JobAsCrewOne.Resolution.ClientWon);
        } else {
            // Valid time - should succeed
            vm.prank(resolver1);
            jobAsCrewOne.resolveDispute(0, JobAsCrewOne.Resolution.ClientWon);
        }
    }

    // Fuzz test for reentrancy protection
    function testFuzz_ReentrancyProtection(uint8 numCalls) public {
        numCalls = uint8(bound(numCalls, 1, 10));
        
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        vm.prank(freelancer);
        jobAsCrewOne.completeMilestone(0, "Done");
        
        // Multiple rapid calls should not cause reentrancy issues
        for (uint8 i = 0; i < numCalls; i++) {
            vm.prank(client);
            try jobAsCrewOne.releasePayment(0) {
                // Should succeed for first call, fail for subsequent calls
                if (i > 0) {
                    fail();
                }
            } catch {
                // Expected for subsequent calls
            }
        }
    }

    // Fuzz test for pause functionality
    function testFuzz_PauseFunctionality(bool pauseState) public {
        vm.prank(owner);
        jobAsCrewOne.togglePause(pauseState);
        
        assertEq(jobAsCrewOne.paused(), pauseState);
        
        // Test that paused contract rejects operations
        if (pauseState) {
            JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
            ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
            
            vm.prank(client);
            vm.expectRevert("Paused");
            jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        }
    }

    // Fuzz test for owner-only functions
    function testFuzz_OwnerOnlyFunctions(address caller) public {
        vm.assume(caller != owner);
        
        vm.prank(caller);
        vm.expectRevert("OnlyOwner");
        jobAsCrewOne.togglePause(true);
        
        vm.prank(caller);
        vm.expectRevert("OnlyOwner");
        jobAsCrewOne.updateCommissionRate(10);
        
        vm.prank(caller);
        vm.expectRevert("OnlyOwner");
        jobAsCrewOne.assignDisputeResolver(resolver1, true);
    }
} 