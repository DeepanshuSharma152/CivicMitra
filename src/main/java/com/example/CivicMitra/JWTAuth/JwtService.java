package com.example.CivicMitra.JWTAuth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import static javax.crypto.Cipher.SECRET_KEY;


@Service
public class JwtService {
    // 1. THE SECRET KEY: This is the "Seal of Authority" for CIVICMITRA.
    // In a real app, move this to application.properties.
    private static final String SECRET_KEY = "YourSuperSecretKeyThatIsAtLeast32CharactersLongForSecurity";

public String generateToken(UserDetails userDetails){
    Map<String, Object> extraClaims = new HashMap<>();
    // Extract the role from UserDetails and put it in the map
    extraClaims.put("role", userDetails.getAuthorities().iterator().next().getAuthority());
    return createToken(new HashMap<>(),userDetails.getUsername());
}

public String createToken(Map<String,Object> claims,String subject){
    return Jwts.builder()
            .setClaims(claims)
            .setSubject(subject) // The user's email
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 hours
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
}

    // 3. EXTRACTION: Pulling the user's email out of the token "envelope".
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    // 4. VALIDATION: Checking if the token is tampered with or expired.
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

}
