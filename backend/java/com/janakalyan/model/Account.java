package com.janakalyan.model;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Represents a member's savings account: balance + full transaction ledger.
 * Encapsulates all money-movement logic so no other class can mutate the
 * balance without going through deposit()/withdraw()/applyQuarterlyInterest().
 */
public class Account {

    private static final double QUARTERLY_INTEREST_RATE = 0.04; // 4%, per spec

    // Quarter-end dates that trigger interest: 31/03, 30/06, 30/09, 31/12
    private static final List<MonthDay> QUARTER_ENDS = List.of(
        MonthDay.of(3, 31),
        MonthDay.of(6, 30),
        MonthDay.of(9, 30),
        MonthDay.of(12, 31)
    );

    private final String accountNo;
    private double balance;
    private final List<Transaction> transactions = new ArrayList<>();

    public Account(String accountNo, double openingBalance) {
        this.accountNo = accountNo;
        this.balance = openingBalance;
    }

    public String getAccountNo() { return accountNo; }
    public double getBalance() { return balance; }

    public void deposit(double amount, String description) {
        if (amount <= 0) throw new IllegalArgumentException("Deposit amount must be positive.");
        balance += amount;
        transactions.add(0, new Transaction(nextTxnId(), Transaction.Type.DEPOSIT, description, amount));
    }

    public void withdraw(double amount, String description) {
        if (amount <= 0) throw new IllegalArgumentException("Withdrawal amount must be positive.");
        if (amount > balance) throw new IllegalStateException("Insufficient balance.");
        balance -= amount;
        transactions.add(0, new Transaction(nextTxnId(), Transaction.Type.WITHDRAWAL, description, amount));
    }

    /**
     * Adds 4% quarterly interest if today is a quarter-end date and interest
     * hasn't already been applied today. Call this once per day from a
     * scheduled task (e.g. cron / Windows Task Scheduler triggering the
     * desktop app, or a JDBC batch job) for every account in the database.
     */
    public boolean applyQuarterlyInterestIfDue(LocalDate today) {
        MonthDay todayMonthDay = MonthDay.from(today);
        if (!QUARTER_ENDS.contains(todayMonthDay)) return false;

        boolean alreadyApplied = transactions.stream()
            .anyMatch(t -> t.getType() == Transaction.Type.INTEREST
                && t.getDate().toLocalDate().equals(today));
        if (alreadyApplied) return false;

        double interest = Math.round(balance * QUARTERLY_INTEREST_RATE * 100.0) / 100.0;
        balance += interest;
        transactions.add(0, new Transaction(nextTxnId(), Transaction.Type.INTEREST,
            "Quarterly Interest (4%)", interest));
        return true;
    }

    /** "Account statement" — full, unmodifiable transaction history. */
    public List<Transaction> getAccountStatement() {
        return Collections.unmodifiableList(transactions);
    }

    /** "Recent Transaction" — latest deposits only (renamed from "Recent deposit" per spec). */
    public List<Transaction> getRecentTransactions(int limit) {
        return transactions.stream()
            .filter(t -> t.getType() == Transaction.Type.DEPOSIT)
            .limit(limit)
            .toList();
    }

    private String nextTxnId() {
        return "TXN" + System.currentTimeMillis() + transactions.size();
    }
}
