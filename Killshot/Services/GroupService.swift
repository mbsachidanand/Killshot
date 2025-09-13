//
//  GroupService.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import Foundation
import Combine

// MARK: - Group Service Protocol
@MainActor
protocol GroupServiceProtocol {
    var groups: [Group] { get }
    var isLoading: Bool { get }
    var error: APIError? { get }

    func loadGroups()
    func refreshGroups()
    func createGroup(name: String, description: String?)
    func updateGroup(id: String, name: String?, description: String?)
    func deleteGroup(id: String)
}

// MARK: - Group Service Implementation
/**
 * GroupService - Handles all group-related operations
 *
 * This service communicates with the TypeScript backend API to:
 * - Fetch groups from the database
 * - Create, update, and delete groups
 * - Handle real-time updates and error states
 */
@MainActor
class GroupService: ObservableObject, GroupServiceProtocol {
    @Published var groups: [Group] = []
    @Published var isLoading: Bool = false
    @Published var error: APIError? = nil

    private let apiService: APIServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    private var lastFetchTime: Date?
    private let cacheValidityDuration: TimeInterval = 30 // 30 seconds cache

    // Callback for UI refresh
    var onGroupsUpdated: (() -> Void)?

    init(apiService: APIServiceProtocol = APIService.shared) {
        self.apiService = apiService
    }

    // MARK: - Public Methods
    func loadGroups() {
        // Check if we have recent cached data
        if let lastFetch = lastFetchTime,
           Date().timeIntervalSince(lastFetch) < cacheValidityDuration,
           !groups.isEmpty {
            return // Use cached data
        }

        guard !isLoading else { return }

        isLoading = true
        error = nil

        apiService.fetchGroups()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false

                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] groups in
                    // Update groups immediately on main thread
                    self?.groups = groups
                    self?.lastFetchTime = Date()
                    // Call the UI refresh callback
                    self?.onGroupsUpdated?()
                }
            )
            .store(in: &cancellables)
    }

    func refreshGroups() {
        loadGroups()
    }

    func refreshGroupsWithRetry(maxRetries: Int = 3) {
        loadGroups()

        // If we still have stale data after a short delay, retry
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            // Check if we need to retry based on data freshness
            // This is a simple retry mechanism
            if maxRetries > 0 {
                self.refreshGroupsWithRetry(maxRetries: maxRetries - 1)
            }
        }
    }

    func createGroup(name: String, description: String? = nil) {
        guard !isLoading else { return }

        isLoading = true
        error = nil

        apiService.createGroup(name: name, description: description)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false

                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] newGroup in
                    self?.groups.append(newGroup)
                }
            )
            .store(in: &cancellables)
    }

    func updateGroup(id: String, name: String? = nil, description: String? = nil) {
        guard !isLoading else { return }

        isLoading = true
        error = nil

        apiService.updateGroup(id: id, name: name, description: description)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false

                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] updatedGroup in
                    if let index = self?.groups.firstIndex(where: { $0.id == id }) {
                        self?.groups[index] = updatedGroup
                    }
                }
            )
            .store(in: &cancellables)
    }

    func deleteGroup(id: String) {
        guard !isLoading else { return }

        isLoading = true
        error = nil

        apiService.deleteGroup(id: id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false

                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.groups.removeAll { $0.id == id }
                }
            )
            .store(in: &cancellables)
    }

    // MARK: - Helper Methods
    func clearError() {
        error = nil
    }

    func getGroup(by id: String) -> Group? {
        return groups.first { $0.id == id }
    }
}
