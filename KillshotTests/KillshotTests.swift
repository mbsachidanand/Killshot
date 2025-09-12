//
//  KillshotTests.swift
//  KillshotTests
//
//  Created by Sachidanand M B on 08/09/25.
//

import Testing
@testable import Killshot

struct KillshotTests {

    @Test func testGroupModelProperties() async throws {
        // Test Group model basic properties
        let group = Group(
            id: "1",
            name: "Test Group",
            description: "Test Description",
            members: [],
            expenses: [],
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            memberCount: "0",
            totalExpenses: "0.00"
        )
        
        #expect(group.id == "1")
        #expect(group.name == "Test Group")
        #expect(group.description == "Test Description")
        #expect(group.memberCountInt == 0)
        #expect(group.totalExpensesDouble == 0.0)
    }
    
    @Test func testGroupMemberCountCalculation() async throws {
        let members = [
            GroupMember(id: "1", name: "John", email: "john@test.com", joinedAt: "2025-01-01T00:00:00Z"),
            GroupMember(id: "2", name: "Jane", email: "jane@test.com", joinedAt: "2025-01-01T00:00:00Z")
        ]
        
        let group = Group(
            id: "1",
            name: "Test Group",
            description: "Test Description",
            members: members,
            expenses: [],
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            memberCount: "2",
            totalExpenses: "0.00"
        )
        
        #expect(group.memberCountInt == 2)
    }
    
    @Test func testExpenseModelProperties() async throws {
        let expense = Expense(
            id: "1",
            title: "Test Expense",
            amount: 100.50,
            paidBy: "user1",
            groupId: "group1",
            splitType: "equal",
            splitDetails: [],
            date: "2025-01-01T00:00:00Z",
            description: "Test Description",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z"
        )
        
        #expect(expense.id == "1")
        #expect(expense.title == "Test Expense")
        #expect(expense.amount == 100.50)
        #expect(expense.paidBy == "user1")
        #expect(expense.groupId == "group1")
    }
    
    @Test func testAPIErrorLocalizedDescription() async throws {
        let networkError = APIError.networkError(NSError(domain: "Test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Test error"]))
        #expect(networkError.localizedDescription.contains("Network error"))
        
        let serverError = APIError.serverError(500, "Internal Server Error")
        #expect(serverError.localizedDescription.contains("Server error 500"))
        
        let validationError = APIError.validationError(["Field is required"])
        #expect(validationError.localizedDescription.contains("Validation failed"))
    }

}
