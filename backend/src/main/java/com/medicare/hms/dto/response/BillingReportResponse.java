package com.medicare.hms.dto.response;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BillingReportResponse {

    private BigDecimal totalBilled = BigDecimal.ZERO;
    private BigDecimal totalCollected = BigDecimal.ZERO;
    private BigDecimal totalOutstanding = BigDecimal.ZERO;
    private long totalBillsCount;
    private long paidBillsCount;
    private long pendingBillsCount;
    private List<BillResponse> bills = new ArrayList<>();

    public BillingReportResponse() {
    }

    public BigDecimal getTotalBilled() {
        return totalBilled;
    }

    public void setTotalBilled(BigDecimal totalBilled) {
        this.totalBilled = totalBilled;
    }

    public BigDecimal getTotalCollected() {
        return totalCollected;
    }

    public void setTotalCollected(BigDecimal totalCollected) {
        this.totalCollected = totalCollected;
    }

    public BigDecimal getTotalOutstanding() {
        return totalOutstanding;
    }

    public void setTotalOutstanding(BigDecimal totalOutstanding) {
        this.totalOutstanding = totalOutstanding;
    }

    public long getTotalBillsCount() {
        return totalBillsCount;
    }

    public void setTotalBillsCount(long totalBillsCount) {
        this.totalBillsCount = totalBillsCount;
    }

    public long getPaidBillsCount() {
        return paidBillsCount;
    }

    public void setPaidBillsCount(long paidBillsCount) {
        this.paidBillsCount = paidBillsCount;
    }

    public long getPendingBillsCount() {
        return pendingBillsCount;
    }

    public void setPendingBillsCount(long pendingBillsCount) {
        this.pendingBillsCount = pendingBillsCount;
    }

    public List<BillResponse> getBills() {
        return bills;
    }

    public void setBills(List<BillResponse> bills) {
        this.bills = bills;
    }
}
