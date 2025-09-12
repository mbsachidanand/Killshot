//
//  APIService.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

// MARK: - Imports
import Foundation
import Combine

// MARK: - API Service Protocol
/**
 * APIServiceProtocol - Defines the contract for API operations
 *
 * This protocol defines all the methods needed to interact with our backend API.
 * Using a protocol allows us to easily swap implementations for testing or different environments.
 *
 * All methods return AnyPublisher<SuccessType, APIError> which is Combine's reactive programming pattern.
 * This means the UI can subscribe to these publishers and automatically update when data changes.
 */
protocol APIServiceProtocol {
    // Group-related API calls
    func fetchGroups() -> AnyPublisher<[Group], APIError>  // Get all groups
    func fetchGroup(id: String) -> AnyPublisher<GroupDetail, APIError>  // Get specific group details
    func createGroup(name: String, description: String?) -> AnyPublisher<Group, APIError>  // Create new group
    func updateGroup(id: String, name: String?, description: String?) -> AnyPublisher<Group, APIError>  // Update existing group
    func deleteGroup(id: String) -> AnyPublisher<Void, APIError>  // Delete group

    // Expense-related API calls
    func createExpense(title: String, amount: Double, paidBy: String, groupId: String, splitType: String, date: String, description: String?) -> AnyPublisher<Expense, APIError>  // Create new expense
}

// MARK: - API Error
/**
 * APIError - Custom error type for API operations
 *
 * This enum defines all possible errors that can occur when making API calls.
 * It conforms to Error and LocalizedError protocols, which means:
 * - Error: Can be thrown and caught
 * - LocalizedError: Provides user-friendly error messages
 *
 * Each case represents a different type of error that can happen:
 * - Network issues (invalidURL, noData, networkError)
 * - Server responses (serverError, unauthorized, forbidden, notFound, rateLimited)
 * - Data processing (decodingError, validationError)
 * - Unknown issues (unknownError)
 */
enum APIError: Error, LocalizedError {
    case invalidURL          // The URL is malformed or invalid
    case noData             // No data received from the server
    case decodingError      // Failed to parse JSON response
    case networkError(Error) // Network connectivity issues
    case serverError(Int, String) // Server returned an error (status code + message)
    case validationError([String]) // Input validation failed
    case unauthorized       // User is not authenticated
    case forbidden          // User doesn't have permission
    case notFound          // Requested resource doesn't exist
    case rateLimited       // Too many requests made
    case unknownError      // Catch-all for unexpected errors

    /**
     * errorDescription - Provides user-friendly error messages
     *
     * This computed property is required by the LocalizedError protocol.
     * It returns a human-readable description of what went wrong.
     * These messages are shown to users in alerts and error states.
     */
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return "Server error \(code): \(message)"
        case .validationError(let errors):
            return "Validation failed: \(errors.joined(separator: ", "))"
        case .unauthorized:
            return "You are not authorized to perform this action"
        case .forbidden:
            return "Access to this resource is forbidden"
        case .notFound:
            return "The requested resource was not found"
        case .rateLimited:
            return "Too many requests. Please try again later"
        case .unknownError:
            return "An unknown error occurred"
        }
    }

    /**
     * recoverySuggestion - Provides helpful suggestions for resolving errors
     *
     * This computed property is also part of the LocalizedError protocol.
     * It gives users actionable advice on how to fix the problem.
     * These suggestions can be shown alongside error messages.
     */
    var recoverySuggestion: String? {
        switch self {
        case .networkError:
            return "Please check your internet connection and try again"
        case .serverError:
            return "Please try again later or contact support if the problem persists"
        case .validationError:
            return "Please check your input and try again"
        case .unauthorized, .forbidden:
            return "Please log in again"
        case .notFound:
            return "The item you're looking for may have been deleted"
        case .rateLimited:
            return "Please wait a moment before trying again"
        default:
            return "Please try again or contact support if the problem persists"
        }
    }
}

// MARK: - API Service Implementation
/**
 * APIService - Handles all communication with the backend API
 *
 * This class implements the APIServiceProtocol and provides methods to:
 * - Make HTTP requests to our backend
 * - Handle responses and errors
 * - Convert data between Swift models and JSON
 *
 * It uses Combine's reactive programming to return publishers that the UI can subscribe to.
 * This allows for automatic UI updates when data changes.
 */
class APIService: APIServiceProtocol {
    // MARK: - Singleton Pattern
    /**
     * shared - Singleton instance of APIService
     *
     * Using a singleton ensures we have only one instance of the API service
     * throughout the app, which is efficient and prevents conflicts.
     */
    static let shared = APIService()

    // MARK: - Configuration
    private let baseURL: String
    private let session: URLSession

    // MARK: - Initialization
    /**
     * Initialize APIService with environment-specific configuration
     *
     * @param baseURL: API base URL (defaults to current environment's URL)
     * @param session: URLSession to use (defaults to shared session)
     */
    init(baseURL: String? = nil, session: URLSession = URLSession.shared) {
        // Use provided baseURL or get from environment configuration
        self.baseURL = baseURL ?? EnvironmentConfig.shared.apiBaseURL
        self.session = session
    }

    // MARK: - Generic Request Method
    /**
     * Generic request method that handles all HTTP requests
     *
     * This is the core method that all API calls use. It:
     * 1. Builds the full URL with cache-busting
     * 2. Creates and configures the HTTP request
     * 3. Sends the request using URLSession
     * 4. Handles HTTP status codes and errors
     * 5. Decodes JSON response to Swift models
     * 6. Returns a Combine publisher for reactive programming
     *
     * Generic type T allows this method to work with any Codable model
     */
    private func request<T: Codable>(
        endpoint: String,           // API endpoint (e.g., "/groups")
        method: HTTPMethod = .GET,  // HTTP method (GET, POST, PUT, DELETE)
        body: Data? = nil          // Request body for POST/PUT requests
    ) -> AnyPublisher<T, APIError> {

        // Add cache-busting parameter to force fresh requests
        // This prevents the app from using cached data when we want fresh data
        let timestamp = Int(Date().timeIntervalSince1970 * 1000) // Use milliseconds for better uniqueness
        let cacheBuster = "?t=\(timestamp)"
        let fullEndpoint = endpoint.contains("?") ? "\(endpoint)&t=\(timestamp)" : "\(endpoint)\(cacheBuster)"

        // Create the full URL
        guard let url = URL(string: "\(baseURL)\(fullEndpoint)") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }

        // Configure the HTTP request
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")  // Tell server we're sending JSON
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")         // Prevent caching
        request.setValue("no-cache", forHTTPHeaderField: "Pragma")                // Additional cache prevention
        request.httpBody = body  // Set request body for POST/PUT requests

        // Send the request and handle the response
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                // Check if we got a valid HTTP response
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.unknownError
                }

                // Handle different HTTP status codes
                switch httpResponse.statusCode {
                case 200...299:
                    // Success - return the data
                    return data
                case 400:
                    // Bad Request - try to parse validation errors
                    if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                        if let errors = errorResponse.errors {
                            throw APIError.validationError(errors.map { $0.message })
                        }
                        throw APIError.serverError(400, errorResponse.message)
                    }
                    throw APIError.serverError(400, "Bad Request")
                case 401:
                    throw APIError.unauthorized
                case 403:
                    throw APIError.forbidden
                case 404:
                    throw APIError.notFound
                case 429:
                    throw APIError.rateLimited
                case 500...599:
                    throw APIError.serverError(httpResponse.statusCode, "Server Error")
                default:
                    throw APIError.serverError(httpResponse.statusCode, "Unknown Error")
                }
            }
            .decode(type: T.self, decoder: JSONDecoder())  // Convert JSON to Swift model
            .mapError { error in
                // Convert any error to our APIError type
                if let apiError = error as? APIError {
                    return apiError
                } else if let decodingError = error as? DecodingError {
                    print("🔍 DecodingError details: \(decodingError)")
                    return APIError.decodingError
                } else {
                    return APIError.networkError(error)
                }
            }
            .eraseToAnyPublisher()  // Convert to AnyPublisher for type erasure
    }

    // MARK: - Groups API Methods
    /**
     * fetchGroups - Gets all groups from the API
     *
     * This method calls the /groups endpoint and returns an array of Group objects.
     * The response is wrapped in a GroupsResponse, so we extract the data property.
     */
    func fetchGroups() -> AnyPublisher<[Group], APIError> {
        return request(endpoint: "/groups", method: .GET, body: nil)
            .map { (response: GroupsResponse) in response.data }  // Extract groups from response wrapper
            .eraseToAnyPublisher()
    }

    /**
     * fetchGroup - Gets a specific group by ID
     *
     * This method calls the /groups/{id} endpoint and returns detailed group information.
     * GroupDetail includes more information than the basic Group model.
     */
    func fetchGroup(id: String) -> AnyPublisher<GroupDetail, APIError> {
        return request(endpoint: "/groups/\(id)", method: .GET, body: nil)
            .map { (response: GroupResponse) in response.data }  // Extract group detail from response wrapper
            .eraseToAnyPublisher()
    }

    /**
     * createGroup - Creates a new group
     *
     * This method sends a POST request to /groups with the group data.
     * We encode the CreateGroupRequest to JSON and send it as the request body.
     */
    func createGroup(name: String, description: String? = nil) -> AnyPublisher<Group, APIError> {
        let groupData = CreateGroupRequest(name: name, description: description)

        // Encode the request data to JSON
        guard let body = try? JSONEncoder().encode(groupData) else {
            return Fail(error: APIError.unknownError)
                .eraseToAnyPublisher()
        }

        return request(endpoint: "/groups", method: .POST, body: body)
            .compactMap { (response: APIResponse<Group>) in response.data }  // Extract created group
            .eraseToAnyPublisher()
    }

    /**
     * updateGroup - Updates an existing group
     *
     * This method sends a PUT request to /groups/{id} with updated group data.
     * Only provided fields will be updated (name and/or description).
     */
    func updateGroup(id: String, name: String? = nil, description: String? = nil) -> AnyPublisher<Group, APIError> {
        let updateData = UpdateGroupRequest(name: name, description: description)

        // Encode the update data to JSON
        guard let body = try? JSONEncoder().encode(updateData) else {
            return Fail(error: APIError.unknownError)
                .eraseToAnyPublisher()
        }

        return request(endpoint: "/groups/\(id)", method: .PUT, body: body)
            .compactMap { (response: APIResponse<Group>) in response.data }  // Extract updated group
            .eraseToAnyPublisher()
    }

    /**
     * deleteGroup - Deletes a group
     *
     * This method sends a DELETE request to /groups/{id}.
     * It returns Void since there's no data to return after deletion.
     */
    func deleteGroup(id: String) -> AnyPublisher<Void, APIError> {
        return request(endpoint: "/groups/\(id)", method: .DELETE, body: nil)
            .map { (_: APIResponse<EmptyResponse>) in () }  // Convert to Void
            .eraseToAnyPublisher()
    }

    // MARK: - Expenses API Methods
    /**
     * createExpense - Creates a new expense
     *
     * This method sends a POST request to /expenses with the expense data.
     * It includes all the necessary information for creating an expense:
     * - title: What the expense is for
     * - amount: How much was spent
     * - paidBy: Who paid for it
     * - groupId: Which group it belongs to
     * - splitType: How to split the expense (defaults to "equal")
     * - date: When the expense occurred
     * - description: Optional additional details
     */
    func createExpense(title: String, amount: Double, paidBy: String, groupId: String, splitType: String = "equal", date: String, description: String? = nil) -> AnyPublisher<Expense, APIError> {
        let expenseData = CreateExpenseRequest(
            title: title,
            amount: amount,
            paidBy: paidBy,
            groupId: groupId,
            splitType: splitType,
            date: date,
            description: description
        )

        // Encode the expense data to JSON
        guard let body = try? JSONEncoder().encode(expenseData) else {
            return Fail(error: APIError.unknownError)
                .eraseToAnyPublisher()
        }

        return request(endpoint: "/expenses", method: .POST, body: body)
            .compactMap { (response: APIResponse<Expense>) in response.data }  // Extract created expense
            .eraseToAnyPublisher()
    }
}

// MARK: - HTTP Methods
/**
 * HTTPMethod - Enum for HTTP request methods
 *
 * This enum defines the standard HTTP methods used in REST APIs.
 * Each case maps to its corresponding HTTP method string.
 */
enum HTTPMethod: String {
    case GET = "GET"      // Retrieve data
    case POST = "POST"    // Create new data
    case PUT = "PUT"      // Update existing data
    case DELETE = "DELETE" // Remove data
    case PATCH = "PATCH"  // Partial update
}

// MARK: - Request Models
/**
 * CreateGroupRequest - Data structure for creating a new group
 *
 * This struct defines the data needed to create a group via the API.
 * It conforms to Codable so it can be easily converted to/from JSON.
 */
struct CreateGroupRequest: Codable {
    let name: String        // Required: Group name
    let description: String? // Optional: Group description

    enum CodingKeys: String, CodingKey {
        case name, description
    }
}

/**
 * UpdateGroupRequest - Data structure for updating an existing group
 *
 * All fields are optional since we only want to update provided fields.
 * This allows for partial updates (e.g., only updating the name).
 */
struct UpdateGroupRequest: Codable {
    let name: String?        // Optional: New group name
    let description: String? // Optional: New group description

    enum CodingKeys: String, CodingKey {
        case name, description
    }
}

/**
 * EmptyResponse - Empty response for DELETE operations
 *
 * DELETE operations typically don't return data, so we use this empty struct
 * to represent successful deletion responses.
 */
struct EmptyResponse: Codable {
    // Empty response for DELETE operations
}

/**
 * CreateExpenseRequest - Data structure for creating a new expense
 *
 * This struct contains all the information needed to create an expense.
 * It includes details about the expense, who paid, and how it should be split.
 */
struct CreateExpenseRequest: Codable {
    let title: String       // What the expense is for
    let amount: Double      // How much was spent
    let paidBy: String      // ID of the person who paid
    let groupId: String     // ID of the group this expense belongs to
    let splitType: String   // How to split the expense (e.g., "equal")
    let date: String        // When the expense occurred (ISO 8601 format)
    let description: String? // Optional additional details

    enum CodingKeys: String, CodingKey {
        case title, amount, paidBy, groupId, splitType, date, description
    }
}

// MARK: - Error Response Models
/**
 * ErrorResponse - Structure for API error responses
 *
 * This struct represents the standard error response format from our backend API.
 * It includes information about what went wrong and when it happened.
 */
struct ErrorResponse: Codable {
    let success: Bool              // Always false for error responses
    let message: String            // Main error message
    let errors: [ValidationError]? // Detailed validation errors (if any)
    let timestamp: String?         // When the error occurred
    let requestId: String?         // Unique identifier for this request

    enum CodingKeys: String, CodingKey {
        case success, message, errors, timestamp, requestId
    }
}

/**
 * ValidationError - Structure for individual validation errors
 *
 * This struct represents a specific validation error for a particular field.
 * It's used when the server validates input and finds issues.
 */
struct ValidationError: Codable {
    let field: String    // Which field has the error
    let message: String  // What's wrong with the field
    let value: String?   // The invalid value that was provided

    enum CodingKeys: String, CodingKey {
        case field, message, value
    }
}
