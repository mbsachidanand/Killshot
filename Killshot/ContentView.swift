//
//  ContentView.swift
//  Killshot
//
//  Created by Sachidanand M B on 08/09/25.
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif


struct ContentView: View {
    @StateObject private var groupService = GroupService()
    @State private var showingAddExpense = false
    @State private var selectedGroupForDetails: Group?
    @State private var showSuccessAlert = false
    
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
    
    
    var body: some View {
        NavigationStack {
            mainContent
                .onAppear {
                    groupService.loadGroups()
                }
                .onChange(of: groupService.groups) { oldGroups, newGroups in
                    print("🔄 ContentView: Groups updated, count: \(newGroups.count)")
                    
                    // If we have a pending navigation, find the updated group and navigate
                    if let pendingGroup = selectedGroupForDetails {
                        if let updatedGroup = newGroups.first(where: { $0.id == pendingGroup.id }) {
                            print("🔄 ContentView: Found updated group for navigation: \(updatedGroup.name)")
                            selectedGroupForDetails = updatedGroup
                        }
                    }
                }
        }
        #if os(iOS)
        .fullScreenCover(isPresented: $showingAddExpense) {
            AddExpenseView(onExpenseAdded: { group in
                print("🔄 ContentView: Received group from AddExpenseView: \(group?.name ?? "nil")")
                
                // Navigate to group details page if group is provided
                if let group = group {
                    print("🔄 ContentView: Setting up navigation to group: \(group.name)")
                    print("🔄 ContentView: Group ID: \(group.id)")
                    
                    // Set up navigation immediately
                    selectedGroupForDetails = group
                    showSuccessAlert = true
                    print("🔄 ContentView: selectedGroupForDetails set to: \(group.name)")
                    
                    // Refresh groups in background
                    groupService.refreshGroups()
                } else {
                    print("🔄 ContentView: No group provided, not navigating")
                    // Still refresh groups even if no navigation
                    groupService.refreshGroups()
                }
            })
        }
        #else
        .sheet(isPresented: $showingAddExpense) {
            AddExpenseView(onExpenseAdded: { group in
                print("🔄 ContentView: Received group from AddExpenseView: \(group?.name ?? "nil")")
                
                // Navigate to group details page if group is provided
                if let group = group {
                    print("🔄 ContentView: Setting up navigation to group: \(group.name)")
                    print("🔄 ContentView: Group ID: \(group.id)")
                    
                    // Set up navigation immediately
                    selectedGroupForDetails = group
                    showSuccessAlert = true
                    print("🔄 ContentView: selectedGroupForDetails set to: \(group.name)")
                    
                    // Refresh groups in background
                    groupService.refreshGroups()
                } else {
                    print("🔄 ContentView: No group provided, not navigating")
                    // Still refresh groups even if no navigation
                    groupService.refreshGroups()
                }
            })
        }
        #endif
        .navigationDestination(item: $selectedGroupForDetails) { group in
            GroupDetailView(group: group, showSuccessMessage: showSuccessAlert)
                .onAppear {
                    print("🔄 ContentView: Navigation destination triggered for group: \(group.name)")
                    // Reset the success alert flag after navigation
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        showSuccessAlert = false
                    }
                }
                .onDisappear {
                    print("🔄 ContentView: GroupDetailView disappeared, clearing selectedGroupForDetails")
                    selectedGroupForDetails = nil
                }
        }
    }
    
    // MARK: - Main Content
    private var mainContent: some View {
        VStack(spacing: 0) {
            appTitle
            addExpenseButton
            ScrollView {
                groupsList
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.gray.opacity(0.1))
        #if os(iOS)
        .toolbar(.hidden, for: .navigationBar)
        #endif
    }
    
    // MARK: - App Title
    private var appTitle: some View {
        Text("Expense Manager")
            .font(.largeTitle)
            .fontWeight(.bold)
            .foregroundColor(.primary)
            .padding(.top, 20)
            .padding(.bottom, 30)
            .accessibilityAddTraits(.isHeader)
            .accessibilityLabel("Expense Manager - Track and split expenses with your groups")
    }
    
    // MARK: - Add Expense Button
    private var addExpenseButton: some View {
        Button(action: {
            showingAddExpense = true
        }) {
            HStack {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
                Text("Add expense")
                    .font(.headline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.8)]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(12)
            .shadow(color: Color.blue.opacity(0.3), radius: 4, x: 0, y: 2)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
        .accessibilityLabel("Add new expense")
        .accessibilityHint("Tap to create a new expense for any group")
        .buttonStyle(PlainButtonStyle())
    }
    
    // MARK: - Groups List
    private var groupsList: some View {
        VStack(spacing: 8) {
            if let error = groupService.error {
                errorView(error)
            } else if groupService.isLoading {
                loadingView
            } else if userGroups.isEmpty {
                emptyStateView
            } else {
                ForEach(Array(userGroups.enumerated()), id: \.element.id) { index, group in
                    groupRow(for: group, at: index)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Group Row
    private func groupRow(for group: Group, at index: Int) -> some View {
        NavigationLink(destination: GroupDetailView(group: group, showSuccessMessage: false)) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(group.name)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    if !group.description.isEmpty {
                        Text(group.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    HStack(spacing: 12) {
                        Label("\(group.memberCountInt)", systemImage: "person.2")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        if group.totalExpensesDouble > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "indianrupeesign.circle")
                                    .font(.caption2)
                                Text("\(String(format: "%.0f", group.totalExpensesDouble))")
                                    .font(.caption2)
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.green)
                        }
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.primary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(group.name) group with \(group.memberCountInt) members")
        .accessibilityHint("Tap to view group details and expenses")
        .accessibilityValue(group.totalExpensesDouble > 0 ? "Total expenses: ₹\(String(format: "%.0f", group.totalExpensesDouble))" : "No expenses yet")
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Loading groups...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "folder")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text("No groups found")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("Create your first group to get started")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Create Group") {
                // TODO: Implement create group functionality
            }
            .font(.subheadline)
            .foregroundColor(.blue)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    // MARK: - Error View
    private func errorView(_ error: APIError) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.red)
            
            Text("Something went wrong")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text(error.localizedDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button("Try Again") {
                groupService.clearError()
                groupService.refreshGroups()
            }
            .font(.subheadline)
            .foregroundColor(.blue)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

// Group detail view
struct GroupDetailView: View {
    let group: Group
    let showSuccessMessage: Bool
    @State private var showAlert = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Group header
            VStack(alignment: .leading, spacing: 8) {
                Text(group.name)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                if !group.description.isEmpty {
                    Text(group.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                HStack(spacing: 16) {
                    Label("\(group.memberCountInt) members", systemImage: "person.2")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if group.totalExpensesDouble > 0 {
                        Label("₹\(String(format: "%.0f", group.totalExpensesDouble)) total", systemImage: "indianrupeesign.circle")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.horizontal)
            
            Divider()
            
            // Group content
            VStack(alignment: .leading, spacing: 16) {
                Text("Recent Expenses")
                    .font(.headline)
                    .padding(.horizontal)
                
                if group.totalExpensesDouble == 0 {
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
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                } else {
                    // TODO: Add expense list here
                    Text("Expense list will be implemented here")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                }
            }
            
            Spacer()
        }
        .navigationTitle(group.name)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .alert("Expense Added!", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text("Your expense has been successfully added to this group.")
        }
        .onAppear {
            // Show alert if this view was navigated to after adding an expense
            if showSuccessMessage {
                showAlert = true
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
    
    // Validation states
    @State private var titleError = ""
    @State private var amountError = ""
    @State private var groupError = ""
    
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
                    inputField(label: "Title", text: $title, placeholder: "Enter expense title", error: titleError)
                    
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
                groupService.loadGroups()
                // Set the paid by field to current user
                paidBy = "\(currentUser.name) (me)"
                // Debug: Print available members
                print("Available members: \(memberDisplayOptions)")
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
    private func inputField(label: String, text: Binding<String>, placeholder: String, error: String = "") -> some View {
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
                HStack {
                    Text("No groups available")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
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
                    print("Invalid amount or group")
                    return
                }
                
                // Format date for API
                let formatter = ISO8601DateFormatter()
                let dateString = formatter.string(from: when)
                
                // Get the selected member ID
                guard let selectedMemberId = getMemberId(from: paidBy) else {
                    print("Error: Could not find member ID for selected payer")
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
                        // Refresh groups with a delay to ensure database transaction is fully committed
                        print("🔄 Expense created successfully, refreshing groups...")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                            groupService?.refreshGroups()
                        }
                        
                        // Pass the selected group to the parent view first, then dismiss after navigation is set up
                        print("🔄 AddExpenseView: Calling onExpenseAdded with group: \(selectedGroup?.name ?? "nil")")
                        onExpenseAdded?(selectedGroup)
                        
                        // Dismiss after a short delay to allow navigation to be set up
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            dismiss()
                        }
                    }
                }
            } else {
                print("Please fill in all required fields and select a group")
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
