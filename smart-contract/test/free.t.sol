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
}