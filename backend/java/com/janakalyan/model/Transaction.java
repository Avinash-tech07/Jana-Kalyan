package com.janakalyan.model;

import java.time.LocalDateTime;

/**
 * Represents a single entry in a member's account statement.
 * Immutable by design — once recorded, a transaction is never edited,
 * only ever appended to (mirrors a real passbook ledger).
 */
public class Transaction {

    public enum Type { DEPOSIT, WITHDRAWAL, INTEREST, LOAN_DISBURSEMENT }

    private final String txnId;
    private final Type type;
    private final String description;
    private final double amount;
    private final LocalDateTime date;

    public Transaction(String txnId, Type type, String description, double amount) {
        this.txnId = txnId;
        this.type = type;
        this.description = description;
        this.amount = amount;
        this.date = LocalDateTime.now();
    }

    public String getTxnId() { return txnId; }
    public Type getType() { return type; }
    public String getDescription() { return description; }
    public double getAmount() { return amount; }
    public LocalDateTime getDate() { return date; }

    @Override
    public String toString() {
        String sign = (type == Type.WITHDRAWAL) ? "-" : "+";
        return String.format("[%s] %-10s %-25s %s%.2f", date, type, description, sign, amount);
    }
}
