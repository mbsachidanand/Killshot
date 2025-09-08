//
//  APIService.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import Foundation
import Combine

// MARK: - API Service Protocol
protocol APIServiceProtocol {
    func fetchGroups() -> AnyPublisher<[Group], APIError>
    func fetchGroup(id: String) -> AnyPublisher<GroupDetail, APIError>
    func createGroup(name: String, description: String?) -> AnyPublisher<Group, APIError>
    func updateGroup(id: String, name: String?, description: String?) -> AnyPublisher<Group, APIError>
    func deleteGroup(id: String) -> AnyPublisher<Void, APIError>
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case networkError(Error)
    case serverError(Int, String)
    case unknownError
    
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
        case .unknownError:
            return "An unknown error occurred"
        }
    }
}

// MARK: - API Service Implementation
class APIService: APIServiceProtocol {
    static let shared = APIService()
    
    private let baseURL = "http://localhost:3001/api/v1"
    private let session = URLSession.shared
    
    private init() {}
    
    // MARK: - Generic Request Method
    private func request<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil
    ) -> AnyPublisher<T, APIError> {
        
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if error is DecodingError {
                    return APIError.decodingError
                } else {
                    return APIError.networkError(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Groups API Methods
    func fetchGroups() -> AnyPublisher<[Group], APIError> {
        return request<GroupsResponse>(endpoint: "/groups", method: .GET, body: nil)
            .map { response in response.data }
            .eraseToAnyPublisher()
    }
    
    func fetchGroup(id: String) -> AnyPublisher<GroupDetail, APIError> {
        return request<GroupResponse>(endpoint: "/groups/\(id)", method: .GET, body: nil)
            .map { response in response.data }
            .eraseToAnyPublisher()
    }
    
    func createGroup(name: String, description: String? = nil) -> AnyPublisher<Group, APIError> {
        let groupData = CreateGroupRequest(name: name, description: description)
        
        guard let body = try? JSONEncoder().encode(groupData) else {
            return Fail(error: APIError.unknownError)
                .eraseToAnyPublisher()
        }
        
        return request<APIResponse<Group>>(endpoint: "/groups", method: .POST, body: body)
            .compactMap { response in response.data }
            .eraseToAnyPublisher()
    }
    
    func updateGroup(id: String, name: String? = nil, description: String? = nil) -> AnyPublisher<Group, APIError> {
        let updateData = UpdateGroupRequest(name: name, description: description)
        
        guard let body = try? JSONEncoder().encode(updateData) else {
            return Fail(error: APIError.unknownError)
                .eraseToAnyPublisher()
        }
        
        return request<APIResponse<Group>>(endpoint: "/groups/\(id)", method: .PUT, body: body)
            .compactMap { response in response.data }
            .eraseToAnyPublisher()
    }
    
    func deleteGroup(id: String) -> AnyPublisher<Void, APIError> {
        return request<APIResponse<EmptyResponse>>(endpoint: "/groups/\(id)", method: .DELETE, body: nil)
            .map { _ in () }
            .eraseToAnyPublisher()
    }
}

// MARK: - HTTP Methods
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}

// MARK: - Request Models
struct CreateGroupRequest: Codable {
    let name: String
    let description: String?
    
    enum CodingKeys: String, CodingKey {
        case name, description
    }
}

struct UpdateGroupRequest: Codable {
    let name: String?
    let description: String?
    
    enum CodingKeys: String, CodingKey {
        case name, description
    }
}

struct EmptyResponse: Codable {
    // Empty response for DELETE operations
}
