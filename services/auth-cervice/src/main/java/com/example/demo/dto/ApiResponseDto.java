package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor // This annotation ALREADY creates the (String, Object) constructor
public class ApiResponseDto {
    private String message;
    private Object data;
}