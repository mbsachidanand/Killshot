//
//  ExpenseService.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import Foundation
import Combine

// MARK: - Expense Service Protocol
@MainActor
protocol ExpenseServiceProtocol {
    var isLoading: Bool { get }
    var error: APIError? { get }
    
    func createExpense(title: String, amount: Double, paidBy: String, groupId: String, splitType: String, date: String, description: String?)
    func clearError()
}

// MARK: - Expense Service Implementation
@MainActor
class ExpenseService: ObservableObject, ExpenseServiceProtocol {
    @Published var isLoading: Bool = false
    @Published var error: APIError? = nil
    
    private let apiService: APIServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(apiService: APIServiceProtocol = APIService.shared) {
        self.apiService = apiService
    }
    
    // MARK: - Public Methods
    func createExpense(title: String, amount: Double, paidBy: String, groupId: String, splitType: String = "equal", date: String, description: String? = nil) {
        guard !isLoading else { return }
        
        isLoading = true
        error = nil
        
        apiService.createExpense(
            title: title,
            amount: amount,
            paidBy: paidBy,
            groupId: groupId,
            splitType: splitType,
            date: date,
            description: description
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error
                    print("🚨 Error creating expense: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] expense in
                print("✅ Successfully created expense: \(expense.title) - ₹\(expense.amount)")
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - Helper Methods
    func clearError() {
        error = nil
    }
}
