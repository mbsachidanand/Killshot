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
@MainActor
class GroupService: ObservableObject, GroupServiceProtocol {
    @Published var groups: [Group] = []
    @Published var isLoading: Bool = false
    @Published var error: APIError? = nil
    @Published var refreshTrigger: UUID = UUID()
    
    private let apiService: APIServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    // Callback for UI refresh
    var onGroupsUpdated: (() -> Void)?
    
    init(apiService: APIServiceProtocol = APIService.shared) {
        self.apiService = apiService
    }
    
    // MARK: - Public Methods
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
                        print("🚨 Error loading groups: \(error.localizedDescription)")
                        print("🚨 Error type: \(type(of: error))")
                        print("🚨 API Error: \(error)")
                    }
                },
                receiveValue: { [weak self] groups in
                    print("🔄 Received \(groups.count) groups from API")
                    for group in groups {
                        print("📊 API Group: \(group.name)")
                        print("   - Backend totalExpenses: \(group.totalExpenses)")
                        print("   - Calculated totalExpensesDouble: \(group.totalExpensesDouble)")
                        print("   - Expenses count: \(group.expenses.count)")
                        print("   - Expenses total: \(group.expenses.reduce(0) { $0 + $1.amount })")
                    }
                    
                    // Update groups immediately on main thread
                    self?.groups = groups
                    print("✅ Updated groups array with \(groups.count) groups")
                    
                    // Verify the data after assignment
                    for group in self?.groups ?? [] {
                        print("📊 Stored Group: \(group.name) - Expenses: \(group.expenses.count) - Total: \(group.totalExpensesDouble)")
                    }
                    
                    // Update refresh trigger to force UI update
                    self?.refreshTrigger = UUID()
                    
                    // Call the UI refresh callback
                    self?.onGroupsUpdated?()
                }
            )
            .store(in: &cancellables)
    }
    
    func refreshGroups() {
        print("🔄 Refreshing groups...")
        loadGroups()
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
    func clearError() {
        error = nil
    }
    
    func getGroup(by id: String) -> Group? {
        return groups.first { $0.id == id }
    }
}
