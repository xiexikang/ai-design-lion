package main

import (
	"ai-design-backend/config"
	"ai-design-backend/routes"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	config.InitConfig()
	
	// 初始化数据库
	config.InitDB()
	
	// 创建Gin实例
	r := gin.Default()
	
	// 配置中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(config.CORSMiddleware())
	
	// 配置路由
	routes.SetupRoutes(r)
	
	// 启动服务器
	port := config.GetPort()
	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}