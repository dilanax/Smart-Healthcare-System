package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationReplyRequest {

    @NotBlank
    private String replyMessage;

    @NotBlank
    private String repliedByName;

    @Email
    @NotBlank
    private String repliedByEmail;
}
