//
//  GroupService.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import Foundation
import Combine

// MARK: - Group Service Protocol
protocol GroupServiceProtocol {
    var groups: [Group] { get }
    var isLoading: Bool { get }
    var error: APIError? { get }
    
    @MainActor func loadGroups()
    @MainActor func refreshGroups()
    @MainActor func createGroup(name: String, description: String?)
    @MainActor func updateGroup(id: String, name: String?, description: String?)
    @MainActor func deleteGroup(id: String)
}

// MARK: - Group Service Implementation
class GroupService: ObservableObject, GroupServiceProtocol {
    @Published var groups: [Group] = []
    @Published var isLoading: Bool = false
    @Published var error: APIError? = nil
    
    private let apiService: APIServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(apiService: APIServiceProtocol = APIService.shared) {
        self.apiService = apiService
    }
    
    // MARK: - Public Methods
    @MainActor
    func loadGroups() {
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
                        print("Error loading groups: \(error.localizedDescription)")
                    }
                },
                receiveValue: { [weak self] groups in
                    self?.groups = groups
                    print("Successfully loaded \(groups.count) groups")
                }
            )
            .store(in: &cancellables)
    }
    
    @MainActor
    func refreshGroups() {
        groups = []
        loadGroups()
    }
    
    @MainActor
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
                        print("Error creating group: \(error.localizedDescription)")
                    }
                },
                receiveValue: { [weak self] newGroup in
                    self?.groups.append(newGroup)
                    print("Successfully created group: \(newGroup.name)")
                }
            )
            .store(in: &cancellables)
    }
    
    @MainActor
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
                        print("Error updating group: \(error.localizedDescription)")
                    }
                },
                receiveValue: { [weak self] updatedGroup in
                    if let index = self?.groups.firstIndex(where: { $0.id == id }) {
                        self?.groups[index] = updatedGroup
                    }
                    print("Successfully updated group: \(updatedGroup.name)")
                }
            )
            .store(in: &cancellables)
    }
    
    @MainActor
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
                        print("Error deleting group: \(error.localizedDescription)")
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.groups.removeAll { $0.id == id }
                    print("Successfully deleted group with id: \(id)")
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Helper Methods
    @MainActor
    func clearError() {
        error = nil
    }
    
    @MainActor
    func getGroup(by id: String) -> Group? {
        return groups.first { $0.id == id }
    }
}
