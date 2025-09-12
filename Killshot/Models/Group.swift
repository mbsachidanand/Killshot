//
//  Group.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

// MARK: - Imports
import Foundation

// MARK: - User Model
/**
 * User - Represents a user in the expense management system
 *
 * This struct defines the basic user information that's used throughout the app.
 * It conforms to several protocols:
 * - Codable: Can be converted to/from JSON for API communication
 * - Identifiable: Has a unique ID for SwiftUI list rendering
 * - Equatable: Can be compared for equality
 */
struct User: Codable, Identifiable, Equatable {
    let id: String    // Unique identifier for the user
    let name: String  // User's display name
    let email: String // User's email address

    enum CodingKeys: String, CodingKey {
        case id, name, email
    }
}

// MARK: - Group Model
/**
 * Group - Represents an expense group with members and expenses
 *
 * This is the main data model for groups in our expense management app.
 * A group contains members who can add and split expenses among themselves.
 *
 * Protocol conformances:
 * - Codable: For JSON serialization/deserialization with the API
 * - Identifiable: Required for SwiftUI list rendering
 * - Equatable: Allows comparison between groups
 * - Hashable: Allows groups to be used in sets and as dictionary keys
 */
struct Group: Codable, Identifiable, Equatable, Hashable {
    // MARK: - Properties
    let id: String              // Unique identifier for the group
    let name: String            // Group name (e.g., "Roommates", "Trip to Japan")
    let description: String     // Optional description of the group
    let members: [GroupMember]  // List of people in this group
    let expenses: [Expense]     // List of expenses in this group
    let createdAt: String       // When the group was created (ISO 8601 format)
    let updatedAt: String       // When the group was last modified (ISO 8601 format)
    let memberCount: Int        // Number of members (from backend)
    let totalExpenses: Double   // Total amount of all expenses (from backend)
    let createdBy: String       // Who created the group

    // MARK: - Computed Properties
    /**
     * memberCountInt - Convenience property to get member count as an integer
     *
     * This provides a more convenient way to access the member count
     * without having to convert from string or count the members array.
     */
    var memberCountInt: Int {
        return memberCount
    }

    /**
     * totalExpensesDouble - Convenience property to get total expenses as a double
     *
     * This provides direct access to the total expenses as a Double.
     * The backend provides this as a number for better type safety.
     */
    var totalExpensesDouble: Double {
        return totalExpenses
    }

    // MARK: - Coding Keys
    enum CodingKeys: String, CodingKey {
        case id, name, description, members, expenses, createdAt, updatedAt, memberCount, totalExpenses, createdBy
    }
}

// MARK: - Group Detail Model
/**
 * GroupDetail - Detailed view of a group with all information
 *
 * This struct is used when we need to fetch detailed information about a group.
 * It's similar to Group but may include additional fields or different structure
 * for the detailed view. It's used when navigating to a group's detail page.
 */
struct GroupDetail: Codable, Identifiable, Equatable, Hashable {
    let id: String              // Unique identifier for the group
    let name: String            // Group name
    let description: String     // Group description
    let members: [GroupMember]  // List of group members
    let expenses: [Expense]     // List of group expenses
    let createdAt: String       // Creation timestamp
    let updatedAt: String       // Last update timestamp
    let memberCount: Int        // Number of members
    let totalExpenses: Double   // Total amount of expenses
    let createdBy: String       // Who created the group

    enum CodingKeys: String, CodingKey {
        case id, name, description, members, expenses, createdAt, updatedAt, memberCount, totalExpenses, createdBy
    }
}

// MARK: - Group Member Model
/**
 * GroupMember - Represents a member of an expense group
 *
 * This struct defines a person who is part of a group and can participate
 * in expense splitting. It includes their basic information and when they joined.
 */
struct GroupMember: Codable, Identifiable, Equatable, Hashable {
    let id: String        // Unique identifier for the member
    let groupId: String   // ID of the group this member belongs to
    let userId: String    // ID of the user
    let name: String      // Member's display name
    let email: String     // Member's email address
    let joinedAt: String  // When they joined the group (ISO 8601 format)

    enum CodingKeys: String, CodingKey {
        case id, groupId, userId, name, email, joinedAt
    }
}

// MARK: - Expense Model
/**
 * Expense - Represents a single expense within a group
 *
 * This struct defines an expense that was added to a group. It includes
 * all the details about the expense, who paid for it, and how it's split
 * among the group members.
 */
struct Expense: Codable, Identifiable, Equatable, Hashable {
    let id: String              // Unique identifier for the expense
    let title: String           // What the expense was for (e.g., "Dinner", "Gas")
    let amount: Double          // Total amount of the expense
    let paidBy: String          // ID of the person who paid for this expense
    let groupId: String         // ID of the group this expense belongs to
    let splitType: String       // How the expense is split (e.g., "equal", "percentage")
    let splits: [SplitDetail]   // Detailed breakdown of how each member owes
    let date: String            // When the expense occurred (ISO 8601 format)
    let description: String     // Optional additional details about the expense
    let createdAt: String       // When the expense was created (ISO 8601 format)
    let updatedAt: String       // When the expense was last modified (ISO 8601 format)

    enum CodingKeys: String, CodingKey {
        case id, title, amount, paidBy, groupId, splitType, splits, date, description, createdAt, updatedAt
    }
}

// MARK: - Split Detail Model
/**
 * SplitDetail - Represents how much each member owes for an expense
 *
 * This struct breaks down how an expense is split among group members.
 * It shows how much each person owes and what percentage of the total
 * expense they're responsible for.
 */
struct SplitDetail: Codable, Identifiable, Equatable, Hashable {
    let id: String          // Unique identifier for the split
    let expenseId: String   // ID of the expense this split belongs to
    let userId: String      // ID of the group member
    let amount: Double      // How much this person owes
    let isPaid: Bool        // Whether this person has paid their share
    let paidAt: String?     // When they paid (optional)

    enum CodingKeys: String, CodingKey {
        case id, expenseId, userId, amount, isPaid, paidAt
    }
}

// MARK: - API Response Models
/**
 * APIResponse - Generic wrapper for API responses
 *
 * This is a generic struct that wraps all API responses from our backend.
 * It provides a consistent structure for success/error states and includes
 * the actual data, metadata, and error information.
 *
 * The generic type T allows this to work with any Codable data type.
 */
struct APIResponse<T: Codable>: Codable {
    let success: Bool    // Whether the request was successful
    let message: String  // Human-readable message about the operation
    let data: T?         // The actual data (nil if error)
    let count: Int?      // Number of items (for list responses)
    let error: String?   // Error message (nil if success)

    enum CodingKeys: String, CodingKey {
        case success, message, data, count, error
    }
}

/**
 * GroupsResponse - Specific response type for group list requests
 *
 * This struct is used when fetching a list of groups from the API.
 * It provides type safety and makes the code more readable.
 */
struct GroupsResponse: Codable {
    let success: Bool      // Whether the request was successful
    let message: String    // Human-readable message
    let data: [Group]      // Array of groups
    let count: Int?        // Number of groups returned
    let error: String?     // Error message if any

    enum CodingKeys: String, CodingKey {
        case success, message, data, count, error
    }
}

/**
 * GroupResponse - Specific response type for single group requests
 *
 * This struct is used when fetching detailed information about a single group.
 * It returns a GroupDetail object with all the group's information.
 */
struct GroupResponse: Codable {
    let success: Bool        // Whether the request was successful
    let message: String      // Human-readable message
    let data: GroupDetail    // Detailed group information
    let error: String?       // Error message if any

    enum CodingKeys: String, CodingKey {
        case success, message, data, error
    }
}
