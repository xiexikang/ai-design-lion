package handlers

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"

    "ai-design-backend/config"

    "github.com/gin-gonic/gin"
)

func getAPIKey(c *gin.Context) string {
    auth := c.GetHeader("Authorization")
    if len(auth) > 7 && auth[:7] == "Bearer " {
        return auth[7:]
    }
    return config.Config.QiniuAPIKey
}

func forwardPost(c *gin.Context, path string) {
    base := config.Config.QiniuBaseURL
    apiKey := getAPIKey(c)

    raw, err := io.ReadAll(c.Request.Body)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
        return
    }

    req, err := http.NewRequest("POST", base+path, bytes.NewReader(raw))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "request init failed"})
        return
    }
    req.Header.Set("Content-Type", "application/json")
    if apiKey != "" {
        req.Header.Set("Authorization", "Bearer "+apiKey)
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        c.JSON(http.StatusBadGateway, gin.H{"error": "upstream request failed"})
        return
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        c.JSON(http.StatusBadGateway, gin.H{"error": "upstream read failed"})
        return
    }

    c.Status(resp.StatusCode)
    c.Header("Content-Type", "application/json")
    c.Writer.Write(body)
}

func ProxyGenerateImage(c *gin.Context) {
    forwardPost(c, "/images/generations")
}

func ProxyEditImage(c *gin.Context) {
    forwardPost(c, "/images/edits")
}

func ProxyModels(c *gin.Context) {
    base := config.Config.QiniuBaseURL
    apiKey := getAPIKey(c)

    req, err := http.NewRequest("GET", base+"/models", nil)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "request init failed"})
        return
    }
    if apiKey != "" {
        req.Header.Set("Authorization", "Bearer "+apiKey)
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        c.JSON(http.StatusBadGateway, gin.H{"error": "upstream request failed"})
        return
    }
    defer resp.Body.Close()

    var data any
    dec := json.NewDecoder(resp.Body)
    if err := dec.Decode(&data); err != nil {
        c.JSON(http.StatusBadGateway, gin.H{"error": "upstream decode failed"})
        return
    }

    c.JSON(resp.StatusCode, data)
}