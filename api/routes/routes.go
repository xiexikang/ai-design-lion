package routes

import (
	"ai-design-backend/handlers"
	"ai-design-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
    // 健康检查
    router.GET("/health", handlers.HealthCheck)

    // API路由组
    api := router.Group("/api/v1")
    {
        // 公开路由
        api.POST("/auth/register", handlers.Register)
        api.POST("/auth/login", handlers.Login)
        api.POST("/proxy/images/generations", handlers.ProxyGenerateImage)
        api.POST("/proxy/images/edits", handlers.ProxyEditImage)
        api.GET("/proxy/models", handlers.ProxyModels)

        // 需要认证的路由
        protected := api.Group("")
        protected.Use(middleware.JWTAuth())
        {
            // 用户相关
            protected.GET("/user/profile", handlers.GetUserProfile)
            protected.PUT("/user/profile", handlers.UpdateUserProfile)

			// 项目相关
			protected.GET("/projects", handlers.GetProjects)
			protected.POST("/projects", handlers.CreateProject)
			protected.GET("/projects/:id", handlers.GetProject)
			protected.PUT("/projects/:id", handlers.UpdateProject)
			protected.DELETE("/projects/:id", handlers.DeleteProject)

			// 图片生成
			protected.POST("/generate/image", handlers.GenerateImage)
			protected.POST("/generate/batch", handlers.GenerateBatchImages)
			protected.POST("/generate/edit", handlers.EditImage)

			// 图片管理
			protected.GET("/images", handlers.GetImages)
			protected.GET("/images/:id", handlers.GetImage)
			protected.DELETE("/images/:id", handlers.DeleteImage)
			protected.GET("/images/:id/download", handlers.DownloadImage)
		}
	}
}
