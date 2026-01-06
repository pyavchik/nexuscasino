package com.nexus.casino.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRecordDto {
    private Long id;
    private String gameType;
    private BigDecimal bet;
    private BigDecimal result;
    private LocalDateTime timestamp;
}

