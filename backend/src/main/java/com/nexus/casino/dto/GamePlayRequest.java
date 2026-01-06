package com.nexus.casino.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GamePlayRequest {
    @NotBlank(message = "Game type is required")
    private String gameType;

    @NotNull(message = "Bet amount is required")
    @Min(value = 1, message = "Bet must be at least 1")
    private BigDecimal bet;
}

