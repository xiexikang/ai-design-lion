package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primary_key"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Avatar    string    `json:"avatar"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// 关联
	Projects []Project `json:"projects,omitempty" gorm:"foreignKey:UserID"`
}

type Project struct {
	ID          uuid.UUID `json:"id" gorm:"type:char(36);primary_key"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:char(36);not null"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	Type        string    `json:"type" gorm:"default:'single'"` // single, storyboard
	Status      string    `json:"status" gorm:"default:'active'"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// 关联
	User   User    `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Images []Image `json:"images,omitempty" gorm:"foreignKey:ProjectID"`
}

type Image struct {
	ID          uuid.UUID `json:"id" gorm:"type:char(36);primary_key"`
	ProjectID   uuid.UUID `json:"project_id" gorm:"type:char(36);not null"`
	Prompt      string    `json:"prompt" gorm:"type:text"`
	Model       string    `json:"model"`
	Size        string    `json:"size"`
	ImageURL    string    `json:"image_url"`
	ImageData   string    `json:"image_data" gorm:"type:text"` // Base64 or URL
	Status      string    `json:"status" gorm:"default:'pending'"` // pending, completed, failed
	Error       string    `json:"error,omitempty"`
	GeneratedAt *time.Time `json:"generated_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// 关联
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
}

// 在创建前生成UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (i *Image) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}