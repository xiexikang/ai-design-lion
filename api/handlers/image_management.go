package handlers

import (
	"net/http"

	"ai-design-backend/config"
	"ai-design-backend/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetImages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	projectID := c.Query("project_id")
	var images []models.Image
	
	if projectID != "" {
		projectUUID, err := uuid.Parse(projectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
			return
		}
		
		// 获取项目的图片
		projectImages, err := config.Storage.GetImagesByProjectID(projectUUID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
			return
		}
		
		// 检查项目是否属于当前用户
		project, err := config.Storage.GetProjectByID(projectUUID)
		if err != nil || project == nil || project.UserID != userID.(uuid.UUID) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		
		for _, img := range projectImages {
			images = append(images, *img)
		}
	} else {
		// 获取用户的所有图片
		projects, err := config.Storage.GetProjectsByUserID(userID.(uuid.UUID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
			return
		}
		
		for _, project := range projects {
			projectImages, err := config.Storage.GetImagesByProjectID(project.ID)
			if err != nil {
				continue
			}
			for _, img := range projectImages {
				images = append(images, *img)
			}
		}
	}

	c.JSON(http.StatusOK, images)
}

func GetImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	imageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	image, err := config.Storage.GetImageByID(imageID)
	if err != nil || image == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 检查图片是否属于用户（通过项目）
	project, err := config.Storage.GetProjectByID(image.ProjectID)
	if err != nil || project == nil || project.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.JSON(http.StatusOK, image)
}

func DeleteImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	imageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	// 检查图片是否属于用户
	image, err := config.Storage.GetImageByID(imageID)
	if err != nil || image == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 检查图片是否属于用户（通过项目）
	project, err := config.Storage.GetProjectByID(image.ProjectID)
	if err != nil || project == nil || project.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// 删除图片
	if err := config.Storage.DeleteImage(imageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

func DownloadImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	imageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	image, err := config.Storage.GetImageByID(imageID)
	if err != nil || image == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 检查图片是否属于用户（通过项目）
	project, err := config.Storage.GetProjectByID(image.ProjectID)
	if err != nil || project == nil || project.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// 返回图片数据
	if image.ImageData != "" {
		c.Data(http.StatusOK, "image/png", []byte(image.ImageData))
	} else if image.ImageURL != "" {
		c.Redirect(http.StatusTemporaryRedirect, image.ImageURL)
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image data not found"})
	}
}