//
//  ContentView.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

// MARK: - Imports
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/**
 * ContentView - The main screen of our expense management app
 *
 * This is a SwiftUI View that represents the main interface where users can:
 * - See all their groups
 * - Add new expenses
 * - Navigate to group details
 *
 * SwiftUI Views are like blueprints that describe what the UI should look like
 * and how it should behave. They automatically update when data changes.
 */
struct ContentView: View {

    // MARK: - State Properties
    // These @StateObject and @State properties hold the data that drives our UI

    /**
     * @StateObject - Creates and manages a GroupService instance
     * This service handles all group-related operations like fetching groups from the TypeScript backend API
     * @StateObject means SwiftUI will recreate this if the view is recreated
     */
    @StateObject private var groupService = GroupService()

    /**
     * @State - Local state that controls UI behavior
     * When these values change, SwiftUI automatically updates the UI
     */
    @State private var showingAddExpense = false        // Controls whether the "Add Expense" sheet is shown
    @State private var selectedGroupForDetails: Group?  // Holds the group to navigate to after adding expense
    @State private var showSuccessAlert = false         // Controls whether to show success alert in detail view

    // MARK: - User Data
    /**
     * In a real app, this would come from authentication/login
     * For now, we're using hardcoded user data that matches the database
     */
    private let currentUser = User(id: "1", name: "Rishab", email: "rishab@example.com")

    // MARK: - Computed Properties
    /**
     * This is a computed property that filters groups to show only those where the current user is a member
     *
     * Computed properties are recalculated every time they're accessed
     * They're perfect for derived data like this filtered list
     */
    private var userGroups: [Group] {
        return groupService.groups.filter { group in
            group.members.contains { member in
                member.id == currentUser.id
            }
        }
    }


    // MARK: - Main View Body
    /**
     * The body property is the main content of our SwiftUI View
     * It must return some View (any SwiftUI view)
     * This is where we define the structure and layout of our screen
     */
    var body: some View {
        // NavigationStack provides navigation capabilities (like UINavigationController in UIKit)
        NavigationStack {
            mainContent
                // onAppear is called when this view appears on screen
                // Perfect place to load data from the TypeScript backend when the view first shows
                .onAppear {
                    groupService.loadGroups()
                }
                // onChange watches for changes to groupService.groups
                // When groups are updated (e.g., after adding an expense), this runs
                .onChange(of: groupService.groups) { oldGroups, newGroups in
                    // Only update if we have a pending navigation and the group count changed
                    if let pendingGroup = selectedGroupForDetails, oldGroups.count != newGroups.count {
                        if let updatedGroup = newGroups.first(where: { $0.id == pendingGroup.id }) {
                            selectedGroupForDetails = updatedGroup
                        }
                    }
                }
                // MARK: - Navigation Destination
                // navigationDestination defines what view to show when navigating to a group
                // It automatically triggers when selectedGroupForDetails is set to a non-nil value
                .navigationDestination(item: $selectedGroupForDetails) { group in
                    // Create the GroupDetailView with the selected group
                    GroupDetailView(group: group, showSuccessMessage: showSuccessAlert) {
                        // Callback to reset the success alert flag
                        showSuccessAlert = false
                    }
                    .onAppear {
                        // Navigation destination triggered
                    }
                    .onDisappear {
                        // Clear the selected group when we navigate away
                        // This prevents the same group from being selected again
                        selectedGroupForDetails = nil
                    }
                }
        }
        // MARK: - Sheet Presentation
        // Different sheet styles for different platforms
        #if os(iOS)
        // fullScreenCover presents a modal that covers the entire screen
        // Perfect for important forms like adding expenses
        .fullScreenCover(isPresented: $showingAddExpense) {
            // When the sheet is presented, create an AddExpenseView
            // The onExpenseAdded closure is called when an expense is successfully added
            AddExpenseView(onExpenseAdded: { group in
                // Navigate to group details page if group is provided
                if let group = group {
                    // Set up navigation immediately with success alert
                    selectedGroupForDetails = group
                    showSuccessAlert = true

                    // Only refresh groups if we don't already have fresh data
                    if groupService.groups.isEmpty {
                        groupService.refreshGroups()
                    }
                } else {
                    // Only refresh groups if we don't already have data
                    if groupService.groups.isEmpty {
                        groupService.refreshGroups()
                    }
                }
            })
        }
        #else
        // sheet presents a modal that slides up from the bottom
        // Used on macOS and other platforms
        .sheet(isPresented: $showingAddExpense) {
            AddExpenseView(onExpenseAdded: { group in
                // Navigate to group details page if group is provided
                if let group = group {
                    // Set up navigation immediately with success alert
                    selectedGroupForDetails = group
                    showSuccessAlert = true

                    // Only refresh groups if we don't already have fresh data
                    if groupService.groups.isEmpty {
                        groupService.refreshGroups()
                    }
                } else {
                    // Only refresh groups if we don't already have data
                    if groupService.groups.isEmpty {
                        groupService.refreshGroups()
                    }
                }
            })
        }
        #endif
    }

    // MARK: - Main Content
    /**
     * This computed property defines the main content of our screen
     * It's broken down into smaller, reusable components for better organization
     */
    private var mainContent: some View {
        // VStack arranges views vertically (top to bottom)
        // spacing: 0 means no space between child views
        VStack(spacing: 0) {
            appTitle           // The "Expense Manager" title at the top
            addExpenseButton   // The blue "Add expense" button
            ScrollView {       // Scrollable container for the groups list
                groupsList     // The list of groups
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity) // Make ScrollView fill available space
        }
        .background(Color.gray.opacity(0.1)) // Light gray background
        #if os(iOS)
        .toolbar(.hidden, for: .navigationBar) // Hide the default navigation bar on iOS
        #endif
    }

    // MARK: - App Title
    /**
     * The main title of the app displayed at the top
     * This is a reusable component that can be easily modified
     */
    private var appTitle: some View {
        Text("Expense Manager")
            .font(.largeTitle)                    // Large, prominent text size
            .fontWeight(.bold)                    // Bold text weight
            .foregroundColor(.primary)            // Uses the system's primary text color (adapts to light/dark mode)
            .padding(.top, 20)                    // Space from the top of the screen
            .padding(.bottom, 30)                 // Space below the title
            .accessibilityAddTraits(.isHeader)    // Tells VoiceOver this is a header
            .accessibilityLabel("Expense Manager - Track and split expenses with your groups") // VoiceOver description
    }

    // MARK: - Add Expense Button
    /**
     * The primary action button for adding new expenses
     * This is a custom-styled button with a gradient background and icon
     */
    private var addExpenseButton: some View {
        Button(action: {
            // When tapped, show the Add Expense sheet
            showingAddExpense = true
        }) {
            // HStack arranges the icon and text horizontally
            HStack {
                // SF Symbol icon (Apple's built-in icon system)
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
                Text("Add expense")
                    .font(.headline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(.white)              // White text and icon
            .frame(maxWidth: .infinity)           // Button stretches to full width
            .frame(height: 50)                    // Fixed height for consistent appearance
            .background(
                // Linear gradient from blue to slightly transparent blue
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.8)]),
                    startPoint: .leading,         // Gradient starts from left
                    endPoint: .trailing           // Gradient ends at right
                )
            )
            .cornerRadius(12)                     // Rounded corners
            .shadow(color: Color.blue.opacity(0.3), radius: 4, x: 0, y: 2) // Subtle shadow
        }
        .padding(.horizontal, 20)                 // Horizontal padding from screen edges
        .padding(.bottom, 30)                     // Space below the button
        .accessibilityLabel("Add new expense")    // VoiceOver label
        .accessibilityHint("Tap to create a new expense for any group") // VoiceOver hint
        .buttonStyle(PlainButtonStyle())          // Remove default button styling
    }

    // MARK: - Groups List
    /**
     * The main list of groups with different states:
     * - Loading: Shows a spinner while fetching data
     * - Error: Shows error message if something went wrong
     * - Empty: Shows message when no groups exist
     * - Content: Shows the actual list of groups
     */
    private var groupsList: some View {
        VStack(spacing: 8) {
            // Conditional rendering based on the current state
            if let error = groupService.error {
                // Show error view if there's an error
                errorView(error)
            } else if groupService.isLoading {
                // Show loading spinner while data is being fetched
                loadingView
            } else if userGroups.isEmpty {
                // Show empty state when no groups exist
                emptyStateView
            } else {
                // Show the actual list of groups using LazyVStack for better performance
                LazyVStack(spacing: 8) {
                    ForEach(Array(userGroups.enumerated()), id: \.element.id) { index, group in
                        groupRow(for: group, at: index)
                    }
                }
            }
        }
        .padding(.horizontal, 20)  // Horizontal padding from screen edges
        .padding(.bottom, 20)      // Bottom padding
    }

    // MARK: - Group Row
    /**
     * Creates a row for each group in the list
     * This is a function that takes a Group and returns a View
     * Each row shows group info and can be tapped to navigate to group details
     */
    private func groupRow(for group: Group, at index: Int) -> some View {
        // NavigationLink makes the entire row tappable and navigates to GroupDetailView
        NavigationLink(destination: GroupDetailView(group: group, showSuccessMessage: false, onAlertDismissed: nil)) {
            HStack {
                // Left side: Group information
                VStack(alignment: .leading, spacing: 4) {
                    // Group name
                    Text(group.name)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .lineLimit(1)  // Truncate if too long

                    // Group description (only show if not empty)
                    if !group.description.isEmpty {
                        Text(group.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)  // Allow up to 2 lines
                    }

                    // Bottom row: Member count and total expenses
                    HStack(spacing: 12) {
                        // Member count with person icon
                        Label("\(group.memberCountInt)", systemImage: "person.2")
                            .font(.caption2)
                            .foregroundColor(.secondary)

                        // Total expenses (only show if > 0)
                        if group.totalExpensesDouble > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "indianrupeesign.circle")
                                    .font(.caption2)
                                Text("\(String(format: "%.0f", group.totalExpensesDouble))")
                                    .font(.caption2)
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.green)  // Green color for money
                        }
                    }
                }

                // Spacer pushes content to the left and right
                Spacer()

                // Right side: Chevron indicating this is tappable
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.primary)
            }
            .padding(.horizontal, 20)  // Horizontal padding inside the row
            .padding(.vertical, 16)    // Vertical padding inside the row
            .background(Color.white)   // White background
            .cornerRadius(12)          // Rounded corners
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1) // Subtle shadow
        }
        .buttonStyle(PlainButtonStyle())  // Remove default button styling
        .accessibilityElement(children: .combine)  // Combine all text for VoiceOver
        .accessibilityLabel("\(group.name) group with \(group.memberCountInt) members")
        .accessibilityHint("Tap to view group details and expenses")
        .accessibilityValue(group.totalExpensesDouble > 0 ? "Total expenses: ₹\(String(format: "%.0f", group.totalExpensesDouble))" : "No expenses yet")
    }

    // MARK: - Loading View
    /**
     * Shows a loading spinner while groups are being fetched from the API
     * This appears when groupService.isLoading is true
     */
    private var loadingView: some View {
        VStack(spacing: 16) {
            // ProgressView is SwiftUI's built-in loading spinner
            ProgressView()
                .scaleEffect(1.2)  // Make it slightly larger

            Text("Loading groups...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)  // Center the content
        .padding(.vertical, 40)      // Vertical padding for spacing
    }

    // MARK: - Empty State View
    /**
     * Shows when the user has no groups yet
     * Provides guidance on what to do next
     */
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            // Large folder icon to represent empty state
            Image(systemName: "folder")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("No groups found")
                .font(.headline)
                .foregroundColor(.primary)

            Text("Create your first group to get started")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)  // Center-align multi-line text

            Button("Create Group") {
                // TODO: Implement create group functionality (future feature)
                // This would typically show a create group form
            }
            .font(.subheadline)
            .foregroundColor(.blue)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)  // Center the content
        .padding(.vertical, 40)      // Vertical padding for spacing
    }

    // MARK: - Error View
    /**
     * Shows when there's an error loading groups
     * Displays the error message and provides a retry button
     */
    private func errorView(_ error: APIError) -> some View {
        VStack(spacing: 16) {
            // Warning triangle icon
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.red)

            Text("Something went wrong")
                .font(.headline)
                .foregroundColor(.primary)

            // Show the actual error message
            Text(error.localizedDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)  // Horizontal padding for text wrapping

            Button("Try Again") {
                // Clear the error and retry loading groups
                groupService.clearError()
                groupService.refreshGroups()
            }
            .font(.subheadline)
            .foregroundColor(.blue)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)  // Center the content
        .padding(.vertical, 40)      // Vertical padding for spacing
    }
}

// MARK: - Group Detail View
/**
 * GroupDetailView - Shows detailed information about a specific group
 *
 * This view displays:
 * - Group name and description
 * - Member count and total expenses
 * - List of recent expenses
 * - Success alert when navigating from expense creation
 */
struct GroupDetailView: View {
    // MARK: - Properties
    let group: Group                    // The group to display details for
    let showSuccessMessage: Bool        // Whether to show success alert on appear
    let onAlertDismissed: (() -> Void)? // Callback when alert is dismissed
    @State private var showAlert = false // Controls the success alert display
    @State private var hasShownAlert = false // Prevents showing alert multiple times

    // MARK: - Main View Body
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // MARK: - Group Header Section
            VStack(alignment: .leading, spacing: 8) {
                // Group name as large title
                Text(group.name)
                    .font(.largeTitle)
                    .fontWeight(.bold)

                // Group description (only show if not empty)
                if !group.description.isEmpty {
                    Text(group.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                // Group stats: member count and total expenses
                HStack(spacing: 16) {
                    // Member count with person icon
                    Label("\(group.memberCountInt) members", systemImage: "person.2")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    // Total expenses (only show if > 0)
                    if group.totalExpensesDouble > 0 {
                        Label("₹\(String(format: "%.0f", group.totalExpensesDouble)) total", systemImage: "indianrupeesign.circle")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.horizontal)  // Horizontal padding for the header

            Divider()  // Visual separator between header and content

            // MARK: - Group Content Section
            VStack(alignment: .leading, spacing: 16) {
                Text("Recent Expenses")
                    .font(.headline)
                    .padding(.horizontal)

                // Conditional content based on whether there are expenses
                if group.totalExpensesDouble == 0 {
                    // Empty state when no expenses exist
                    VStack(spacing: 12) {
                        Image(systemName: "receipt")
                            .font(.system(size: 32))
                            .foregroundColor(.secondary)

                        Text("No expenses yet")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        Text("Add your first expense to get started")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)  // Center the empty state
                    .padding(.vertical, 40)
                } else {
                    // TODO: Add expense list here (future enhancement)
                    // This would show a list of expenses when implemented
                    Text("Expense list will be implemented here")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                }
            }

            Spacer()  // Push content to the top
        }
        // MARK: - Navigation Configuration
        .navigationTitle(group.name)  // Set the navigation bar title
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)  // Use inline title style on iOS
        #endif

        // MARK: - Success Alert
        // Alert that shows when navigating here after adding an expense
        .alert("Expense Added!", isPresented: $showAlert) {
            Button("OK") {
                // Call the callback to reset the success alert flag
                onAlertDismissed?()
            }
        } message: {
            Text("Your expense has been successfully added to this group.")
        }
        .onAppear {
            // Show alert if this view was navigated to after adding an expense
            if showSuccessMessage && !hasShownAlert {
                hasShownAlert = true
                // Use a longer delay to ensure the view is fully loaded and navigation is complete
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    showAlert = true
                }
            }
        }
    }
}

// MARK: - Add Expense View
struct AddExpenseView: View {
    @State private var title = ""
    @State private var amount = ""
    @State private var paidBy = "Rishab (me)" // Will be updated in onAppear
    @State private var when = Date()
    @State private var selectedGroup: Group?
    @State private var showingGroupPicker = false
    @State private var splitType = "Equally"
    @FocusState private var isTitleFieldFocused: Bool

    // Validation states
    @State private var titleError = ""
    @State private var amountError = ""
    @State private var groupError = ""

    // MARK: - Services
    // Services for API communication with TypeScript backend
    @StateObject private var groupService = GroupService()
    @StateObject private var expenseService = ExpenseService()
    @Environment(\.dismiss) private var dismiss

    let onExpenseAdded: ((Group?) -> Void)?

    // Current user information - in a real app, this would come from authentication
    private let currentUser = User(id: "1", name: "Rishab", email: "rishab@example.com")

    // Filter groups to show only those where current user is a member
    private var userGroups: [Group] {
        return groupService.groups.filter { group in
            group.members.contains { member in
                member.id == currentUser.id
            }
        }
    }

    // Get all unique members from user's groups for "Paid by" selection
    private var availableMembers: [GroupMember] {
        let allMembers = userGroups.flatMap { $0.members }
        let uniqueMembers = Dictionary(grouping: allMembers, by: { $0.id })
            .compactMap { $0.value.first }
        return uniqueMembers.sorted { $0.name < $1.name }
    }

    // Convert members to display strings for dropdown
    private var memberDisplayOptions: [String] {
        // Sort members to put current user first, then others alphabetically
        let sortedMembers = availableMembers.sorted { member1, member2 in
            if member1.id == currentUser.id {
                return true // Current user comes first
            } else if member2.id == currentUser.id {
                return false // Other member comes after current user
            } else {
                return member1.name < member2.name // Alphabetical order for others
            }
        }

        return sortedMembers.map { member in
            if member.id == currentUser.id {
                return "\(member.name) (me)"
            } else {
                return member.name
            }
        }
    }

    // Get member ID from display name
    private func getMemberId(from displayName: String) -> String? {
        if displayName == "\(currentUser.name) (me)" {
            return currentUser.id
        }
        return availableMembers.first { member in
            member.name == displayName
        }?.id
    }

    // MARK: - Validation Methods
    private func validateForm() -> Bool {
        var isValid = true

        // Validate title
        if title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            titleError = "Title is required"
            isValid = false
        } else if title.count > 100 {
            titleError = "Title must be less than 100 characters"
            isValid = false
        } else {
            titleError = ""
        }

        // Validate amount
        if amount.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            amountError = "Amount is required"
            isValid = false
        } else if let amountValue = Double(amount), amountValue > 0 {
            amountError = ""
        } else {
            amountError = "Please enter a valid amount greater than 0"
            isValid = false
        }

        // Validate group selection
        if selectedGroup == nil {
            groupError = "Please select a group"
            isValid = false
        } else {
            groupError = ""
        }

        return isValid
    }

    private func clearValidationErrors() {
        titleError = ""
        amountError = ""
        groupError = ""
    }

    var body: some View {
        VStack(spacing: 0) {
            // Navigation header
            HStack {
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(.blue)
                .font(.title3)
                .fontWeight(.medium)

                Spacer()

                Text("Add expense")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)

                Spacer()

                // Invisible button to balance the layout
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(.clear)
                .disabled(true)
            }
            .padding(.horizontal, 16)
            .padding(.top, 60)
            .padding(.bottom, 8)
            .background(Color.gray.opacity(0.03))

            // Main content with light grey background
            VStack(spacing: 0) {
                // Input fields section
                VStack(spacing: 20) {
                    inputField(label: "Title", text: $title, placeholder: "Enter expense title", error: titleError, isFocused: true)

                    amountField

                    // Paid by and When side by side
                    HStack(spacing: 16) {
                        dropdownField(label: "Paid by", value: $paidBy, options: memberDisplayOptions)

                        datePickerField
                    }

                    groupSelectionField
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 20)
                .background(Color.gray.opacity(0.05))

                // Split among section
                splitAmongSection

                Spacer()

                // Add button
                addButton
            }
            .onAppear {
                // Only load groups if we don't have them already
                if groupService.groups.isEmpty {
                    groupService.loadGroups()
                }
                // Set the paid by field to current user
                paidBy = "\(currentUser.name) (me)"

                // Focus the title field after a short delay to ensure the view is fully loaded
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    isTitleFieldFocused = true
                }
            }
        }
        .background(Color.gray.opacity(0.05))
        .ignoresSafeArea(.all, edges: .all)
    }

    // MARK: - Amount Field
    private var amountField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Amount")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)

            HStack(spacing: 8) {
                // Currency symbol in its own separate white box
                Text("₹")
                    .font(.body)
                    .foregroundColor(.primary)
                    .frame(width: 50, height: 50)
                    .background(Color.white)
                    .cornerRadius(12)

                // Amount field in its own separate white box
                TextField("Enter amount", text: $amount)
                    #if canImport(UIKit)
                    .keyboardType(UIKeyboardType.decimalPad)
                    #endif
                    .font(.body)
                    .padding(.horizontal, 16)
                    .frame(height: 50)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(amountError.isEmpty ? Color.gray.opacity(0.3) : Color.red, lineWidth: 1)
                    )
                    .onChange(of: amount) { _, _ in
                        if !amountError.isEmpty {
                            clearValidationErrors()
                        }
                    }
            }

            if !amountError.isEmpty {
                Text(amountError)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }

    // MARK: - Input Field
    private func inputField(label: String, text: Binding<String>, placeholder: String, error: String = "", isFocused: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)

            TextField(placeholder, text: text)
                .font(.body)
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(error.isEmpty ? Color.gray.opacity(0.3) : Color.red, lineWidth: 1)
                )
                .focused($isTitleFieldFocused)
                .onAppear {
                    if isFocused {
                        isTitleFieldFocused = true
                    }
                }

            if !error.isEmpty {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }

    // MARK: - Dropdown Field
    private func dropdownField(label: String, value: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)

            Menu {
                ForEach(options, id: \.self) { option in
                    Button(action: {
                        value.wrappedValue = option
                    }) {
                        Text(option)
                    }
                }
            } label: {
                HStack {
                    Text(value.wrappedValue)
                        .font(.body)
                        .foregroundColor(.primary)

                    Spacer()

                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.primary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Date Picker Field
    private var datePickerField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("When")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)

            DatePicker("", selection: $when, displayedComponents: .date)
                .datePickerStyle(CompactDatePickerStyle())
                .labelsHidden()
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(12)
        }
    }

    // MARK: - Date Formatting Helper
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    // MARK: - Group Selection Field
    private var groupSelectionField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Group")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)

            if groupService.isLoading {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Loading groups...")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(12)
            } else if userGroups.isEmpty {
                HStack(alignment: .center) {
                    Text("No groups available")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(12)
            } else {
                Button(action: {
                    showingGroupPicker = true
                    if !groupError.isEmpty {
                        clearValidationErrors()
                    }
                }) {
                    HStack {
                        Text(selectedGroup?.name ?? "Select a group")
                            .font(.body)
                            .foregroundColor(selectedGroup == nil ? .secondary : .primary)

                        Spacer()

                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.primary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                    .background(Color.white)
                    .cornerRadius(12)
                }
                .sheet(isPresented: $showingGroupPicker) {
                    GroupPickerView(
                        groups: userGroups,
                        selectedGroup: $selectedGroup,
                        isPresented: $showingGroupPicker
                    )
                }
            }

            if !groupError.isEmpty {
                Text(groupError)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }

    // MARK: - Split Among Section
    private var splitAmongSection: some View {
        VStack(spacing: 0) {
            // Header without grey background
            HStack {
                Text("Split among")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)

                Spacer()

                HStack {
                    Text(splitType)
                        .font(.subheadline)
                        .foregroundColor(.primary)

                    Image(systemName: "chevron.down")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.primary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)

            // Members list with individual boxes
            if let selectedGroup = selectedGroup, !selectedGroup.members.isEmpty {
                VStack(spacing: 8) {
                    ForEach(Array(selectedGroup.members.enumerated()), id: \.offset) { index, member in
                        HStack {
                            Text(member.name)
                                .font(.body)
                                .foregroundColor(.primary)

                            Spacer()

                            Text("₹\(String(format: "%.1f", calculateEqualSplit()))")
                                .font(.body)
                                .fontWeight(.medium)
                                .foregroundColor(.primary)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 20)
            } else {
                VStack(spacing: 8) {
                    HStack {
                        Text("Select a group to see members")
                            .font(.body)
                            .foregroundColor(.secondary)

                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 0)
    }

    // MARK: - Helper Functions
    private func calculateEqualSplit() -> Double {
        guard let selectedGroup = selectedGroup,
              !selectedGroup.members.isEmpty,
              let amountValue = Double(amount) else {
            return 0.0
        }
        return amountValue / Double(selectedGroup.members.count)
    }

    // MARK: - Add Button
    private var addButton: some View {
        Button(action: {
            // Handle add expense action
            if validateForm() {
                guard let group = selectedGroup,
                      let amountValue = Double(amount) else {
                    return
                }

                // Format date for API
                let formatter = ISO8601DateFormatter()
                let dateString = formatter.string(from: when)

                // Get the selected member ID
                guard let selectedMemberId = getMemberId(from: paidBy) else {
                    return
                }

                // Create expense
                expenseService.createExpense(
                    title: title,
                    amount: amountValue,
                    paidBy: selectedMemberId, // Selected member's ID
                    groupId: group.id,
                    splitType: "equal",
                    date: dateString,
                    description: nil
                ) { [weak groupService] success in
                    if success {
                        // Pass the selected group to the parent view immediately for navigation setup
                        onExpenseAdded?(selectedGroup)

                        // Dismiss the sheet after a short delay to allow navigation to be set up
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                            dismiss()
                        }
                    }
                }
            }
        }) {
            HStack {
                if expenseService.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                }

                Text(expenseService.isLoading ? "Adding..." : "Add")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                (isFormValid && !expenseService.isLoading ? Color.blue : Color.gray)
            )
            .cornerRadius(12)
        }
        .disabled(!isFormValid || expenseService.isLoading)
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .alert("Error", isPresented: .constant(expenseService.error != nil)) {
            Button("OK") {
                expenseService.clearError()
            }
        } message: {
            Text(expenseService.error?.localizedDescription ?? "An error occurred while creating the expense.")
        }
    }

    // MARK: - Form Validation
    private var isFormValid: Bool {
        return !title.isEmpty && !amount.isEmpty && selectedGroup != nil
    }
}

// MARK: - Group Picker View
struct GroupPickerView: View {
    let groups: [Group]
    @Binding var selectedGroup: Group?
    @Binding var isPresented: Bool

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Select a Group")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    Spacer()

                    Button("Cancel") {
                        isPresented = false
                    }
                    .font(.body)
                    .foregroundColor(.blue)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 20)
                .background(Color.white)

                // Groups list
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(groups, id: \.id) { group in
                            Button(action: {
                                selectedGroup = group
                                isPresented = false
                            }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(group.name)
                                            .font(.body)
                                            .fontWeight(.medium)
                                            .foregroundColor(.primary)

                                        Text(group.description)
                                            .font(.caption)
                                            .foregroundColor(.secondary)

                                        Text("\(group.memberCountInt) members")
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }

                                    Spacer()

                                    if selectedGroup?.id == group.id {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 16, weight: .medium))
                                            .foregroundColor(.blue)
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.vertical, 16)
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }
                .background(Color.gray.opacity(0.05))
            }
            .background(Color.gray.opacity(0.05))
        }
    }
}

#Preview {
    ContentView()
}
