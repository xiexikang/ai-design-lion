package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"ai-design-backend/config"
	"ai-design-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type GenerateImageRequest struct {
	Prompt    string `json:"prompt" binding:"required"`
	Model     string `json:"model"`
	Size      string `json:"size"`
	N         int    `json:"n"`
	ProjectID string `json:"project_id"`
	Template  string `json:"template"`
}

type GenerateImageResponse struct {
	Success bool     `json:"success"`
	Images  []string `json:"images"`
	Message string   `json:"message"`
}

type QiniuImageResponse struct {
	Images []struct {
		URL     string `json:"url"`
		B64JSON string `json:"b64_json"`
	} `json:"images"`
	Data []struct {
		URL     string `json:"url"`
		B64JSON string `json:"b64_json"`
	} `json:"data"`
	Created int    `json:"created"`
	Model   string `json:"model"`
}

func GenerateImage(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req GenerateImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if req.Model == "" {
		req.Model = "gemini-2.5-flash-image"
	}
	if req.Size == "" {
		req.Size = "1024x1024"
	}
	if req.N == 0 {
		req.N = 1
	}

	// 创建图片记录
	image := &models.Image{
		ID:        uuid.New(),
		Prompt:    req.Prompt,
		Model:     req.Model,
		Size:      req.Size,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 如果有项目ID，关联到项目
	if req.ProjectID != "" {
		projectID, err := uuid.Parse(req.ProjectID)
		if err == nil {
			image.ProjectID = projectID
		}
	}

	// 保存到存储
	if err := config.Storage.CreateImage(image); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create image record"})
		return
	}

	// 调用七牛云API生成图片
	images, err := callQiniuImageAPI(req.Prompt, req.Model, req.Size, req.N)
	if err != nil {
		// 更新状态为失败
		image.Status = "failed"
		image.Error = err.Error()
		config.Storage.UpdateImage(image)

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate image"})
		return
	}

	// 更新图片记录
	if len(images) > 0 {
		image.ImageURL = images[0]
		image.Status = "completed"
		now := time.Now()
		image.GeneratedAt = &now
		config.Storage.UpdateImage(image)
	}

	c.JSON(http.StatusOK, GenerateImageResponse{
		Success: true,
		Images:  images,
		Message: "Image generated successfully",
	})
}

func GenerateBatchImages(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Prompts   []string `json:"prompts" binding:"required"`
		Model     string   `json:"model"`
		Size      string   `json:"size"`
		ProjectID string   `json:"project_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if req.Model == "" {
		req.Model = "gemini-2.5-flash-image"
	}
	if req.Size == "" {
		req.Size = "1024x1024"
	}

	var images []string
	for i, prompt := range req.Prompts {
		// 创建图片记录
		image := &models.Image{
			ID:        uuid.New(),
			Prompt:    prompt,
			Model:     req.Model,
			Size:      req.Size,
			Status:    "pending",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// 关联到项目
		if req.ProjectID != "" {
			projectID, err := uuid.Parse(req.ProjectID)
			if err == nil {
				image.ProjectID = projectID
			}
		}

		// 保存到存储
		config.Storage.CreateImage(image)

		// 调用API生成图片
		generatedImages, err := callQiniuImageAPI(prompt, req.Model, req.Size, 1)
		if err != nil {
			image.Status = "failed"
			image.Error = err.Error()
			config.Storage.UpdateImage(image)
			images = append(images, "") // 添加空字符串表示失败
			continue
		}

		// 更新图片记录
		if len(generatedImages) > 0 {
			image.ImageURL = generatedImages[0]
			image.Status = "completed"
			now := time.Now()
			image.GeneratedAt = &now
			config.Storage.UpdateImage(image)
			images = append(images, generatedImages[0])
		} else {
			images = append(images, "")
		}

		// 添加延迟以避免API限流
		if i < len(req.Prompts)-1 {
			time.Sleep(1 * time.Second)
		}
	}

	c.JSON(http.StatusOK, GenerateImageResponse{
		Success: true,
		Images:  images,
		Message: "Batch images generated successfully",
	})
}

func EditImage(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Image     string `json:"image" binding:"required"`
		Prompt    string `json:"prompt" binding:"required"`
		Model     string `json:"model"`
		Size      string `json:"size"`
		Mask      string `json:"mask"`
		ProjectID string `json:"project_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if req.Model == "" {
		req.Model = "gemini-2.5-flash-image"
	}
	if req.Size == "" {
		req.Size = "1024x1024"
	}

	// 调用七牛云图生图API
	payload := map[string]interface{}{
		"model":  req.Model,
		"image":  req.Image,
		"prompt": req.Prompt,
		"size":   req.Size,
		"n":      1,
	}

	if req.Mask != "" {
		payload["mask"] = req.Mask
	}

	jsonData, _ := json.Marshal(payload)

	apiReq, err := http.NewRequest("POST", config.Config.QiniuBaseURL+"/images/edits", bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "Bearer "+config.Config.QiniuAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(apiReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call image API"})
		return
	}
	defer resp.Body.Close()

	var result QiniuImageResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse response"})
		return
	}

	var images []string
	src := result.Images
	if len(src) == 0 {
		src = result.Data
	}
	for _, img := range src {
		if img.URL != "" {
			images = append(images, img.URL)
		} else if img.B64JSON != "" {
			// 处理Base64图片数据
			dataURL := fmt.Sprintf("data:image/png;base64,%s", img.B64JSON)
			images = append(images, dataURL)
		}
	}

	c.JSON(http.StatusOK, GenerateImageResponse{
		Success: true,
		Images:  images,
		Message: "Image edited successfully",
	})
}

func callQiniuImageAPI(prompt, model, size string, n int) ([]string, error) {
	payload := map[string]interface{}{
		"model":           model,
		"prompt":          prompt,
		"size":            size,
		"n":               n,
		"response_format": "url",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", config.Config.QiniuBaseURL+"/images/generations", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.Config.QiniuAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error: %s", string(body))
	}

	var result QiniuImageResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	var images []string
	src := result.Images
	if len(src) == 0 {
		src = result.Data
	}
	for _, img := range src {
		if img.URL != "" {
			images = append(images, img.URL)
		} else if img.B64JSON != "" {
			// 处理Base64图片数据
			dataURL := fmt.Sprintf("data:image/png;base64,%s", img.B64JSON)
			images = append(images, dataURL)
		}
	}

	return images, nil
}
