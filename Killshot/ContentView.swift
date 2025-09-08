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
    
    var body: some View {
        NavigationView {
            mainContent
        }
        .onAppear {
            groupService.loadGroups()
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
        Text("App name")
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
                        Label("\(group.memberCount)", systemImage: "person.2")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        if group.totalExpenses > 0 {
                            Text("₹\(String(format: "%.0f", group.totalExpenses))")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
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
                    Label("\(group.memberCount) members", systemImage: "person.2")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if group.totalExpenses > 0 {
                        Label("₹\(String(format: "%.0f", group.totalExpenses)) total", systemImage: "indianrupeesign.circle")
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
                
                if group.totalExpenses == 0 {
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
    @State private var group = "Group 1"
    @State private var splitType = "Equally"
    
    // Sample participants data
    private let participants = [
        ("Person 1", 62.5),
        ("Person 2", 62.5),
        ("Person 3", 62.5),
        ("Person 4", 62.5)
    ]
    
    @Environment(\.dismiss) private var dismiss
    
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
            .padding(.horizontal, 20)
            .padding(.top, 80)
            .padding(.bottom, 16)
            .background(Color.gray.opacity(0.05))
            
            // Main content with light grey background
            VStack(spacing: 0) {
                // Input fields section
                VStack(spacing: 20) {
                    inputField(label: "Title", text: $title, placeholder: "Enter expense title")
                    
                    amountField
                    
                    // Paid by and When side by side
                    HStack(spacing: 16) {
                        dropdownField(label: "Paid by", value: $paidBy, options: ["Rishab (me)", "Person 2", "Person 3", "Person 4"])
                        
                        datePickerField
                    }
                    
                    dropdownField(label: "Group", value: $group, options: ["Group 1", "Group 2", "Group 3", "Group 4"])
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
            .background(Color.gray.opacity(0.05))
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
                    .foregroundColor(.secondary)
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
            
            HStack {
                Text(formatDate(when))
                    .font(.body)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "calendar")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.blue)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                DatePicker("", selection: $when, displayedComponents: .date)
                    .datePickerStyle(CompactDatePickerStyle())
                    .labelsHidden()
                    .opacity(0.01) // Nearly invisible but still interactive
            )
        }
    }
    
    // MARK: - Date Formatting Helper
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
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
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            
            // Participants list with individual boxes
            VStack(spacing: 8) {
                ForEach(Array(participants.enumerated()), id: \.offset) { index, participant in
                    HStack {
                        Text(participant.0)
                            .font(.body)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Text("₹\(String(format: "%.1f", participant.1))")
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
        }
        .padding(.top, 0)
    }
    
    // MARK: - Add Button
    private var addButton: some View {
        Button(action: {
            // Handle add expense action
            if !title.isEmpty && !amount.isEmpty {
                print("Add expense: \(title) - ₹\(amount) on \(formatDate(when))")
                dismiss()
            } else {
                print("Please fill in all required fields")
            }
        }) {
            Text("Add")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(isFormValid ? Color.blue : Color.gray)
                .cornerRadius(12)
        }
        .disabled(!isFormValid)
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Form Validation
    private var isFormValid: Bool {
        return !title.isEmpty && !amount.isEmpty
    }
}

#Preview {
    ContentView()
}
