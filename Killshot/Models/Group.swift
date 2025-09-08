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
        return expenses.reduce(0) { $0 + $1.amountDouble }
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
    let amount: String
    let paidBy: String
    let date: String
    let groupId: String
    let splitType: String
    let description: String?
    let createdAt: String
    let updatedAt: String
    
    // Computed property for backward compatibility
    var amountDouble: Double {
        return Double(amount) ?? 0.0
    }
    
    enum CodingKeys: String, CodingKey {
        case id, title, amount, paidBy, date, groupId, splitType, description, createdAt, updatedAt
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
