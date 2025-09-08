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
    let memberCount: Int
    let totalExpenses: Double
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, description
        case memberCount = "memberCount"
        case totalExpenses = "totalExpenses"
        case createdAt = "createdAt"
        case updatedAt = "updatedAt"
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
        case id, name, description, members, expenses
        case createdAt = "createdAt"
        case updatedAt = "updatedAt"
    }
}

// MARK: - Group Member Model
struct GroupMember: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let joinedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, email
        case joinedAt = "joinedAt"
    }
}

// MARK: - Expense Model
struct Expense: Codable, Identifiable {
    let id: String
    let title: String
    let amount: Double
    let paidBy: String
    let when: String
    let groupId: String
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, title, amount
        case paidBy = "paidBy"
        case when
        case groupId = "groupId"
        case createdAt = "createdAt"
        case updatedAt = "updatedAt"
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
    let count: Int
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
