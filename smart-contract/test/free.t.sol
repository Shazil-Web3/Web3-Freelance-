// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/free.sol";

contract JobAsCrewOneTest is Test {
    JobAsCrewOne public jobAsCrewOne;
    address public owner = address(0x1);
    address public client = address(0x2);
    address public freelancer = address(0x3);
    address public resolver1 = address(0x4);
    address public resolver2 = address(0x5);

    function setUp() public {
        vm.prank(owner);
        jobAsCrewOne = new JobAsCrewOne();
        vm.deal(owner, 10 ether);
        vm.deal(client, 10 ether);
        vm.deal(freelancer, 10 ether);
        vm.deal(resolver1, 10 ether);
        vm.deal(resolver2, 10 ether);
    }

    function testTogglePause() public {
        vm.prank(owner);
        jobAsCrewOne.togglePause(true);
        assertTrue(jobAsCrewOne.paused());
        
        vm.prank(owner);
        jobAsCrewOne.togglePause(false);
        assertFalse(jobAsCrewOne.paused());
        
        vm.prank(client);
        vm.expectRevert("OnlyOwner");
        jobAsCrewOne.togglePause(true);
    }

    function testAssignDisputeResolver() public {
        vm.prank(owner);
        jobAsCrewOne.assignDisputeResolver(resolver1, true);
        assertTrue(jobAsCrewOne.disputeResolvers(resolver1));
        
        vm.prank(owner);
        jobAsCrewOne.assignDisputeResolver(resolver1, false);
        assertFalse(jobAsCrewOne.disputeResolvers(resolver1));

        vm.prank(owner);
        vm.expectRevert("InvalidAddress");
        jobAsCrewOne.assignDisputeResolver(address(0), true);

        vm.prank(client);
        vm.expectRevert("OnlyOwner");
        jobAsCrewOne.assignDisputeResolver(resolver2, true);
    }

    function testCreateJob() public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](2);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        ms[1] = JobAsCrewOne.Milestone("Milestone 2", 2 ether, false, false, "");
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(client);
        vm.deal(client, 3 ether);
        jobAsCrewOne.createJob{value: 3 ether}("Test Job", ms, deadline);
        
        // Access job details through individual fields
        (address jobClient, , , uint128 totalAmount, , , , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(jobClient, client);
        assertEq(totalAmount, 3 ether);
    }

    function testApplyToProject() public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);

        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        
        // Verify proposal was added by checking job status after selection
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        
        // Check job status changed to InProgress
        ( , , , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.InProgress));
    }

    function testSelectFreelancer() public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);

        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        
        // Access freelancer and status through individual fields
        ( , address jobFreelancer, , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(jobFreelancer, freelancer);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.InProgress));
    }

    function testCompleteMilestone() public {
        JobAsCrewOne.Milestone[] memory initialMs = new JobAsCrewOne.Milestone[](1);
        initialMs[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", initialMs, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);

        vm.prank(freelancer);
        jobAsCrewOne.completeMilestone(0, "Done");
        
        // Verify by releasing payment and checking balance
        uint256 initialBalance = freelancer.balance;
        vm.prank(client);
        jobAsCrewOne.releasePayment(0);
        uint256 commission = (1 ether * jobAsCrewOne.commissionRate()) / 100;
        uint256 expectedPayout = 1 ether - commission;
        assertEq(freelancer.balance, initialBalance + expectedPayout);
    }

    function testUpdateCommissionRate() public {
        vm.prank(owner);
        jobAsCrewOne.updateCommissionRate(10);
        assertEq(jobAsCrewOne.commissionRate(), 10);

        vm.prank(owner);
        vm.expectRevert("InvalidPercent");
        jobAsCrewOne.updateCommissionRate(101);

        vm.prank(client);
        vm.expectRevert("OnlyOwner");
        jobAsCrewOne.updateCommissionRate(5);
    }

    function testReceive() public {
        vm.deal(address(jobAsCrewOne), 0);
        vm.prank(client);
        (bool sent, ) = address(jobAsCrewOne).call{value: 1 ether}("");
        assertTrue(sent);
        assertEq(address(jobAsCrewOne).balance, 1 ether);

        vm.prank(owner);
        jobAsCrewOne.togglePause(true);
        vm.prank(client);
        (bool failed, ) = address(jobAsCrewOne).call{value: 1 ether}("");
        assertFalse(failed);
    }

    function testRaiseDispute() public {
        // Setup job
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);

        // Raise dispute as client
        vm.prank(client);
        jobAsCrewOne.raiseDispute(0, "Quality issue");
        
        ( , , , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.Disputed));

        // Raise dispute as freelancer
        JobAsCrewOne.Milestone[] memory ms2 = new JobAsCrewOne.Milestone[](1);
        ms2[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job 2", ms2, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(1, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(1, freelancer);

        vm.prank(freelancer);
        jobAsCrewOne.raiseDispute(1, "Payment issue");
        
        ( , , , , , JobAsCrewOne.JobStatus status2, , , , , ) = jobAsCrewOne.jobs(1);
        assertEq(uint256(status2), uint256(JobAsCrewOne.JobStatus.Disputed));
    }

    function testResolveDispute() public {
        // Setup job and dispute
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        vm.prank(client);
        jobAsCrewOne.raiseDispute(0, "Quality issue");

        // Setup resolver
        vm.prank(owner);
        jobAsCrewOne.assignDisputeResolver(resolver1, true);

        // Resolve dispute
        vm.prank(resolver1);
        jobAsCrewOne.resolveDispute(0, JobAsCrewOne.Resolution.ClientWon);
        
        ( , , , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.Resolved));
    }

    function testWithdrawFreelancerEarnings() public {
        // Setup job with completed milestone
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

        uint256 initialBalance = freelancer.balance;
        vm.prank(freelancer);
        jobAsCrewOne.withdrawFreelancerEarnings();
        assertGt(freelancer.balance, initialBalance);
    }

    function testCancelProject() public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);

        uint256 initialBalance = client.balance;
        vm.prank(client);
        jobAsCrewOne.cancelProject(0);
        
        ( , , , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.Resolved));
        assertGt(client.balance, initialBalance);
    }

    function testWithdrawPlatformFees() public {
        // Set commission rate first
        vm.prank(owner);
        jobAsCrewOne.updateCommissionRate(10);
        
        // Setup job and generate fees
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
        vm.prank(client);
        jobAsCrewOne.releasePayment(0);

        // Test that platform fees were generated
        assertGt(jobAsCrewOne.platformFees(), 0);
    }

    function testEmergencyWithdraw() public {
        // Setup job and dispute
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);
        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        vm.prank(client);
        jobAsCrewOne.raiseDispute(0, "Quality issue");

        // Test that dispute was raised
        ( , , , , , JobAsCrewOne.JobStatus status, , , , , ) = jobAsCrewOne.jobs(0);
        assertEq(uint256(status), uint256(JobAsCrewOne.JobStatus.Disputed));
    }

    function testInvalidOperations() public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](1);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 1 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);

        // Test invalid freelancer selection
        vm.prank(client);
        vm.expectRevert("NotApplied");
        jobAsCrewOne.selectFreelancer(0, address(0x999));

        // Test invalid milestone completion (wrong caller)
        vm.prank(client);
        vm.expectRevert("OnlyFreelancer");
        jobAsCrewOne.completeMilestone(0, "Done");

        // Test invalid dispute resolution (not a resolver)
        vm.prank(client);
        vm.expectRevert("NotResolver");
        jobAsCrewOne.resolveDispute(0, JobAsCrewOne.Resolution.ClientWon);
    }

    function testSetContractOwner() public {
        vm.prank(owner);
        jobAsCrewOne.setContractOwner(resolver1);
        assertEq(jobAsCrewOne.owner(), resolver1);
    }

    function testRemainingFunds() public {
        JobAsCrewOne.Milestone[] memory ms = new JobAsCrewOne.Milestone[](2);
        ms[0] = JobAsCrewOne.Milestone("Milestone 1", 0.5 ether, false, false, "");
        ms[1] = JobAsCrewOne.Milestone("Milestone 2", 0.5 ether, false, false, "");
        vm.prank(client);
        jobAsCrewOne.createJob{value: 1 ether}("Test Job", ms, block.timestamp + 7 days);

        assertEq(jobAsCrewOne.remainingFunds(0), 1 ether);

        vm.prank(freelancer);
        jobAsCrewOne.applyToProject(0, "I will do it", 1 ether);
        vm.prank(client);
        jobAsCrewOne.selectFreelancer(0, freelancer);
        vm.prank(freelancer);
        jobAsCrewOne.completeMilestone(0, "Done");
        vm.prank(client);
        jobAsCrewOne.releasePayment(0);

        assertEq(jobAsCrewOne.remainingFunds(0), 0.5 ether);
    }
}