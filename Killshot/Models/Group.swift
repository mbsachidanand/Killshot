//
//  Group.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import Foundation

// MARK: - Group Model
struct Group: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let members: [GroupMember]
    let expenses: [Expense]
    let createdAt: String
    let updatedAt: String
    let memberCount: String
    let totalExpenses: String
    
    // Computed properties for backward compatibility
    var memberCountInt: Int {
        return members.count
    }
    
    var totalExpensesDouble: Double {
        let total = expenses.reduce(0) { $0 + $1.amount }
        print("🔢 Calculating total for \(name): \(expenses.count) expenses, total = \(total)")
        return total
    }
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, members, expenses, createdAt, updatedAt, memberCount, totalExpenses
    }
}

// MARK: - Group Detail Model
struct GroupDetail: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let members: [GroupMember]
    let expenses: [Expense]
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, members, expenses, createdAt, updatedAt
    }
}

// MARK: - Group Member Model
struct GroupMember: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let joinedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, joinedAt
    }
}

// MARK: - Expense Model
struct Expense: Codable, Identifiable {
    let id: String
    let title: String
    let amount: Double
    let paidBy: String
    let groupId: String
    let splitType: String
    let splitDetails: [SplitDetail]
    let date: String
    let description: String
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, title, amount, paidBy, groupId, splitType, splitDetails, date, description, createdAt, updatedAt
    }
}

// MARK: - Split Detail Model
struct SplitDetail: Codable, Identifiable {
    let userId: String
    let userName: String
    let amount: Double
    let percentage: Double
    
    var id: String { userId }
    
    enum CodingKeys: String, CodingKey {
        case userId, userName, amount, percentage
    }
}

// MARK: - API Response Models
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let message: String
    let data: T?
    let count: Int?
    let error: String?
    
    enum CodingKeys: String, CodingKey {
        case success, message, data, count, error
    }
}

struct GroupsResponse: Codable {
    let success: Bool
    let message: String
    let data: [Group]
    let count: Int?
    let error: String?
    
    enum CodingKeys: String, CodingKey {
        case success, message, data, count, error
    }
}

struct GroupResponse: Codable {
    let success: Bool
    let message: String
    let data: GroupDetail
    let error: String?
    
    enum CodingKeys: String, CodingKey {
        case success, message, data, error
    }
}
