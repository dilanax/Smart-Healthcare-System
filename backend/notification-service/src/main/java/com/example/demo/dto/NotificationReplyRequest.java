package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationReplyRequest {

    @NotBlank
    private String replyMessage;

    @NotBlank
    private String repliedByName;

    @NotBlank
    @Email
    private String repliedByEmail;
}
