package com.nexus.casino.service;

import com.nexus.casino.dto.GamePlayRequest;
import com.nexus.casino.dto.GameRecordDto;
import com.nexus.casino.entity.GameRecord;
import com.nexus.casino.entity.User;
import com.nexus.casino.repository.GameRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRecordRepository gameRecordRepository;
    private final UserService userService;
    private final Random random = new Random();

    @Transactional
    public GameRecordDto playGame(User user, GamePlayRequest request) {
        if (user.getBalance().compareTo(request.getBet()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Deduct bet from balance
        userService.updateBalance(user, request.getBet().negate());

        // Calculate game result based on game type
        BigDecimal result = calculateGameResult(request.getGameType(), request.getBet());

        // Update balance with result
        userService.updateBalance(user, result);

        // Save game record
        GameRecord gameRecord = GameRecord.builder()
                .user(user)
                .gameType(request.getGameType())
                .bet(request.getBet())
                .result(result.subtract(request.getBet())) // Net result (win - bet)
                .build();

        gameRecord = gameRecordRepository.save(gameRecord);

        return toDto(gameRecord);
    }

    private BigDecimal calculateGameResult(String gameType, BigDecimal bet) {
        return switch (gameType.toLowerCase()) {
            case "slots" -> calculateSlotsResult(bet);
            case "roulette" -> calculateRouletteResult(bet);
            case "blackjack" -> calculateBlackjackResult(bet);
            case "dice" -> calculateDiceResult(bet);
            default -> BigDecimal.ZERO;
        };
    }

    private BigDecimal calculateSlotsResult(BigDecimal bet) {
        // 30% chance to win, with varying multipliers
        if (random.nextDouble() < 0.3) {
            double multiplier = 1.5 + (random.nextDouble() * 10); // 1.5x to 11.5x
            return bet.multiply(BigDecimal.valueOf(multiplier)).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateRouletteResult(BigDecimal bet) {
        // 48% chance to win (slightly less than 50% for house edge)
        if (random.nextDouble() < 0.48) {
            return bet.multiply(BigDecimal.valueOf(2)).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateBlackjackResult(BigDecimal bet) {
        // 42% chance to win
        if (random.nextDouble() < 0.42) {
            return bet.multiply(BigDecimal.valueOf(2.5)).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateDiceResult(BigDecimal bet) {
        // 45% chance to win
        if (random.nextDouble() < 0.45) {
            double multiplier = 1.5 + (random.nextDouble() * 2); // 1.5x to 3.5x
            return bet.multiply(BigDecimal.valueOf(multiplier)).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    public List<GameRecordDto> getGameHistory(User user) {
        return gameRecordRepository.findByUserOrderByTimestampDesc(user)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void clearGameHistory(User user) {
        gameRecordRepository.deleteByUser(user);
    }

    private GameRecordDto toDto(GameRecord record) {
        return GameRecordDto.builder()
                .id(record.getId())
                .gameType(record.getGameType())
                .bet(record.getBet())
                .result(record.getResult())
                .timestamp(record.getTimestamp())
                .build();
    }
}

