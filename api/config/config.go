package config

import (
	"log"
	"os"
	"time"

	"ai-design-backend/storage"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var (
	Storage *storage.MemoryStorage
	Config  *AppConfig
)

type AppConfig struct {
	Port            string
	JWTSecret       string
	QiniuAPIKey     string
	QiniuBaseURL    string
	Environment     string
	MaxImageSize    int64
	AllowedOrigins  []string
}

func InitConfig() {
	// 加载环境变量
	godotenv.Load()
	
	Config = &AppConfig{
		Port:            getEnv("PORT", "8080"),
		JWTSecret:       getEnv("JWT_SECRET", "your-jwt-secret-key"),
		QiniuAPIKey:     getEnv("QINIU_API_KEY", "your-api-key-here"),
		QiniuBaseURL:    getEnv("QINIU_BASE_URL", "https://api.qnaigc.com/v1"),
		Environment:     getEnv("ENVIRONMENT", "development"),
		MaxImageSize:    10 * 1024 * 1024, // 10MB
		AllowedOrigins:  []string{"http://localhost:5173", "http://localhost:3000"},
	}
}

func InitDB() {
	// 使用内存存储
	Storage = storage.GetMemoryStorage()
	log.Println("Using memory storage for development")
}

func AutoMigrate() {
	// 这里会自动创建表结构
	// DB.AutoMigrate(&models.User{}, &models.Project{}, &models.Image{})
}

func GetPort() string {
	if Config != nil {
		return Config.Port
	}
	return "8080"
}

func CORSMiddleware() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     Config.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}