//
//  ExpenseService.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

// MARK: - Imports
import Foundation
import Combine

// MARK: - Expense Service Protocol
/**
 * ExpenseServiceProtocol - Defines the contract for expense-related operations
 *
 * This protocol defines all the methods needed to manage expenses in our app.
 * It provides a clean interface that can be easily mocked for testing.
 *
 * @MainActor ensures all methods run on the main thread, which is required
 * for updating UI properties like @Published variables.
 */
@MainActor
protocol ExpenseServiceProtocol {
    var isLoading: Bool { get }        // Whether an operation is currently in progress
    var error: APIError? { get }       // Current error state (nil if no error)

    // Create a new expense with completion callback
    func createExpense(title: String, amount: Double, paidBy: String, groupId: String, splitType: String, date: String, description: String?, completion: @escaping (Bool) -> Void)
    func clearError()                  // Clear any current error state
}

// MARK: - Expense Service Implementation
/**
 * ExpenseService - Handles all expense-related business logic
 *
 * This class manages expense operations like creating new expenses.
 * It acts as a bridge between the UI and the TypeScript backend API, handling
 * loading states, errors, and data transformation.
 *
 * @MainActor ensures all operations run on the main thread for UI updates.
 * ObservableObject allows SwiftUI views to automatically update when data changes.
 */
@MainActor
class ExpenseService: ObservableObject, ExpenseServiceProtocol {
    // MARK: - Published Properties
    @Published var isLoading: Bool = false  // Tracks if an operation is in progress
    @Published var error: APIError? = nil   // Current error state

    // MARK: - Private Properties
    private let apiService: APIServiceProtocol  // API service for making requests
    private var cancellables = Set<AnyCancellable>()  // Stores Combine subscriptions

    // MARK: - Initialization
    /**
     * Initialize the service with an API service
     *
     * @param apiService: The API service to use (defaults to shared instance)
     * This allows for dependency injection and easier testing
     */
    init(apiService: APIServiceProtocol = APIService.shared) {
        self.apiService = apiService
    }

    // MARK: - Public Methods
    /**
     * createExpense - Creates a new expense and adds it to a group
     *
     * This method handles the complete flow of creating an expense:
     * 1. Validates that no other operation is in progress
     * 2. Sets loading state and clears any previous errors
     * 3. Calls the API service to create the expense
     * 4. Handles the response and updates the UI state
     * 5. Calls the completion handler with success/failure result
     *
     * @param title: What the expense is for
     * @param amount: How much was spent
     * @param paidBy: ID of the person who paid
     * @param groupId: ID of the group this expense belongs to
     * @param splitType: How to split the expense (defaults to "equal")
     * @param date: When the expense occurred (ISO 8601 format)
     * @param description: Optional additional details
     * @param completion: Callback with success/failure result
     */
    func createExpense(title: String, amount: Double, paidBy: String, groupId: String, splitType: String = "equal", date: String, description: String? = nil, completion: @escaping (Bool) -> Void) {
        // Prevent multiple simultaneous operations
        guard !isLoading else {
            completion(false)
            return
        }

        // Set loading state and clear any previous errors
        isLoading = true
        error = nil

        // Call the API service to create the expense
        apiService.createExpense(
            title: title,
            amount: amount,
            paidBy: paidBy,
            groupId: groupId,
            splitType: splitType,
            date: date,
            description: description
        )
        .receive(on: DispatchQueue.main)  // Ensure UI updates happen on main thread
        .sink(
            receiveCompletion: { [weak self] completionResult in
                // Always stop loading when the operation completes
                self?.isLoading = false

                // Handle errors
                if case .failure(let error) = completionResult {
                    self?.error = error
                    completion(false)
                }
            },
            receiveValue: { expense in
                // Success - call completion
                completion(true)
            }
        )
        .store(in: &cancellables)  // Store the subscription to prevent deallocation
    }

    // MARK: - Helper Methods
    /**
     * clearError - Clears any current error state
     *
     * This method is called when the user dismisses an error or when
     * starting a new operation. It resets the error state so the UI
     * can show the normal state again.
     */
    func clearError() {
        error = nil
    }
}
