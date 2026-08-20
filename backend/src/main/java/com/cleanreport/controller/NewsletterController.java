package com.cleanreport.controller;

import com.cleanreport.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/newsletter")
@Tag(name = "Newsletter", description = "Newsletter subscription endpoint")
public class NewsletterController {

    @Operation(summary = "Subscribe to CleanReport newsletter")
    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<Void>> subscribe(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new IllegalArgumentException("A valid email address is required");
        }
        // Subscription is acknowledged and logged.
        // Full email delivery integration is scheduled for Phase 2 (Twilio SendGrid).
        log.info("Newsletter subscription request from: {}", email);
        return ResponseEntity.ok(ApiResponse.ok(null, "Thank you for subscribing! You will receive updates from CleanReport."));
    }
}
