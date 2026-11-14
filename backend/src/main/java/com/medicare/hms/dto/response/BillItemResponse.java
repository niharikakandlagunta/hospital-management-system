package com.medicare.hms.dto.response;

import java.math.BigDecimal;

public class BillItemResponse {

    private Long id;
    private String itemDescription;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    public BillItemResponse() {
    }

    public BillItemResponse(Long id, String itemDescription, int quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
        this.id = id;
        this.itemDescription = itemDescription;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }
}
