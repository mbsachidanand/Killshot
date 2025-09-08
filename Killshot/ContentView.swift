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
    @State private var refreshID = UUID()
    
    var body: some View {
        NavigationView {
            mainContent
                .onAppear {
                    groupService.loadGroups()
                    // Set up callback to refresh UI
                    groupService.onGroupsUpdated = {
                        refreshID = UUID()
                    }
                }
        }
        #if os(iOS)
        .fullScreenCover(isPresented: $showingAddExpense) {
            AddExpenseView()
        }
        #else
        .sheet(isPresented: $showingAddExpense) {
            AddExpenseView()
        }
        #endif
    }
    
    // MARK: - Main Content
    private var mainContent: some View {
        VStack(spacing: 0) {
            appTitle
            addExpenseButton
            groupsList
            Spacer()
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
    }
    
    // MARK: - Add Expense Button
    private var addExpenseButton: some View {
        Button(action: {
            showingAddExpense = true
        }) {
            Text("Add expense")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.blue)
                .cornerRadius(12)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
    }
    
    // MARK: - Groups List
    private var groupsList: some View {
        VStack(spacing: 8) {
            if let error = groupService.error {
                errorView(error)
            } else if groupService.isLoading {
                loadingView
            } else if groupService.groups.isEmpty {
                emptyStateView
            } else {
                ForEach(Array(groupService.groups.enumerated()), id: \.element.id) { index, group in
                    groupRow(for: group, at: index)
                }
            }
        }
        .padding(.horizontal, 20)
        .id(refreshID)
    }
    
    // MARK: - Group Row
    private func groupRow(for group: Group, at index: Int) -> some View {
        NavigationLink(destination: GroupDetailView(group: group)) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(group.name)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    if !group.description.isEmpty {
                        Text(group.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 8) {
                        Label("\(group.memberCountInt)", systemImage: "person.2")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                    if group.totalExpensesDouble > 0 {
                        Text("₹\(String(format: "%.0f", group.totalExpensesDouble))")
                            .font(.caption2)
                            .foregroundColor(.secondary)
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
        }
        .buttonStyle(PlainButtonStyle())
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
    }
}

// MARK: - Add Expense View
struct AddExpenseView: View {
    @State private var title = ""
    @State private var amount = ""
    @State private var paidBy = "Rishab (me)"
    @State private var when = Date()
    @State private var selectedGroup: Group?
    @State private var showingGroupPicker = false
    @State private var splitType = "Equally"
    @State private var isExpenseCreated = false
    @State private var showSuccessAlert = false
    
    @StateObject private var groupService = GroupService()
    @StateObject private var expenseService = ExpenseService()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Navigation header
            HStack {
                Button(isExpenseCreated ? "Done" : "Cancel") {
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
            .padding(.horizontal, 20)
            .padding(.top, 80)
            .padding(.bottom, 16)
            .background(Color.gray.opacity(0.05))
            
            // Main content with light grey background
            VStack(spacing: 0) {
                // Success overlay
                if isExpenseCreated {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.green)
                        
                        Text("Expense Added Successfully!")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                        
                        Text("Your expense has been added to \(selectedGroup?.name ?? "the group")")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.vertical, 40)
                    .frame(maxWidth: .infinity)
                    .background(Color.green.opacity(0.1))
                } else {
                // Input fields section
                VStack(spacing: 20) {
                    inputField(label: "Title", text: $title, placeholder: "Enter expense title")
                    
                    amountField
                    
                    // Paid by and When side by side
                    HStack(spacing: 16) {
                        dropdownField(label: "Paid by", value: $paidBy, options: ["Rishab (me)", "Person 2", "Person 3", "Person 4"])
                        
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
            }
            .onAppear {
                groupService.loadGroups()
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
            }
        }
    }
    
    // MARK: - Input Field
    private func inputField(label: String, text: Binding<String>, placeholder: String) -> some View {
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
        }
    }
    
    // MARK: - Dropdown Field
    private func dropdownField(label: String, value: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
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
            } else if groupService.groups.isEmpty {
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
                        groups: groupService.groups,
                        selectedGroup: $selectedGroup,
                        isPresented: $showingGroupPicker
                    )
                }
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
            if !title.isEmpty && !amount.isEmpty && selectedGroup != nil {
                guard let group = selectedGroup,
                      let amountValue = Double(amount) else {
                    print("Invalid amount or group")
                    return
                }
                
                // Format date for API
                let formatter = ISO8601DateFormatter()
                let dateString = formatter.string(from: when)
                
                // Create expense
                expenseService.createExpense(
                    title: title,
                    amount: amountValue,
                    paidBy: "1", // For now, hardcode to user ID "1" (Rishab)
                    groupId: group.id,
                    splitType: "equal",
                    date: dateString,
                    description: nil
                ) { [weak groupService] success in
                    if success {
                        // Mark as created and show success feedback
                        isExpenseCreated = true
                        showSuccessAlert = true
                        
                        // Refresh groups to show updated data with a small delay
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            groupService?.refreshGroups()
                        }
                        
                        // Auto-dismiss after 2 seconds
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
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
                
                Text(expenseService.isLoading ? "Adding..." : (isExpenseCreated ? "Added!" : "Add"))
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                isExpenseCreated ? Color.green : 
                (isFormValid && !expenseService.isLoading ? Color.blue : Color.gray)
            )
            .cornerRadius(12)
        }
        .disabled(!isFormValid || expenseService.isLoading)
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .alert("Expense Added!", isPresented: $showSuccessAlert) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("Your expense has been successfully added to \(selectedGroup?.name ?? "the group").")
        }
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
