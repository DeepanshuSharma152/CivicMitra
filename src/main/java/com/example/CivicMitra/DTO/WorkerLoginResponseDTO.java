package com.example.CivicMitra.DTO;

/**
 * Response body returned after a successful worker PIN login.
 * POST /api/v1/worker/auth/login → 200 OK
 */
public class WorkerLoginResponseDTO {

    private String token;
    private String workerCode;
    private String name;
    private String role;          // "COLLECTOR" or "SUPERVISOR"
    private Long   workerId;
    private Long   municipalityId;
    private Long   wardId;
    private Long   routeId;
    private String message;

    // ── Builder-style setters ─────────────────────────────────────────────────

    public String getToken()          { return token; }
    public void   setToken(String v)  { this.token = v; }

    public String getWorkerCode()           { return workerCode; }
    public void   setWorkerCode(String v)   { this.workerCode = v; }

    public String getName()           { return name; }
    public void   setName(String v)   { this.name = v; }

    public String getRole()           { return role; }
    public void   setRole(String v)   { this.role = v; }

    public Long   getWorkerId()         { return workerId; }
    public void   setWorkerId(Long v)   { this.workerId = v; }

    public Long   getMunicipalityId()         { return municipalityId; }
    public void   setMunicipalityId(Long v)   { this.municipalityId = v; }

    public Long   getWardId()          { return wardId; }
    public void   setWardId(Long v)    { this.wardId = v; }

    public Long   getRouteId()         { return routeId; }
    public void   setRouteId(Long v)   { this.routeId = v; }

    public String getMessage()          { return message; }
    public void   setMessage(String v)  { this.message = v; }
}
