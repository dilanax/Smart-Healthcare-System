package com.example.demo.dto;

public class ApiResponseDto {
    private String message;
    private Object data;

    public ApiResponseDto() {
    }

    public ApiResponseDto(String message, Object data) {
        this.message = message;
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}