package storage

import (
	"sync"
	"ai-design-backend/models"
	"github.com/google/uuid"
)

type MemoryStorage struct {
	users    map[uuid.UUID]*models.User
	projects map[uuid.UUID]*models.Project
	images   map[uuid.UUID]*models.Image
	mu       sync.RWMutex
}

var (
	instance *MemoryStorage
	once     sync.Once
)

func GetMemoryStorage() *MemoryStorage {
	once.Do(func() {
		instance = &MemoryStorage{
			users:    make(map[uuid.UUID]*models.User),
			projects: make(map[uuid.UUID]*models.Project),
			images:   make(map[uuid.UUID]*models.Image),
		}
	})
	return instance
}

func (s *MemoryStorage) CreateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	s.users[user.ID] = user
	return nil
}

func (s *MemoryStorage) GetUserByID(id uuid.UUID) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	if user, exists := s.users[id]; exists {
		return user, nil
	}
	return nil, nil
}

func (s *MemoryStorage) GetUserByEmail(email string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	for _, user := range s.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, nil
}

func (s *MemoryStorage) UpdateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if _, exists := s.users[user.ID]; !exists {
		return nil
	}
	s.users[user.ID] = user
	return nil
}

func (s *MemoryStorage) CreateProject(project *models.Project) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if project.ID == uuid.Nil {
		project.ID = uuid.New()
	}
	s.projects[project.ID] = project
	return nil
}

func (s *MemoryStorage) GetProjectByID(id uuid.UUID) (*models.Project, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	if project, exists := s.projects[id]; exists {
		return project, nil
	}
	return nil, nil
}

func (s *MemoryStorage) GetProjectsByUserID(userID uuid.UUID) ([]*models.Project, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var projects []*models.Project
	for _, project := range s.projects {
		if project.UserID == userID {
			projects = append(projects, project)
		}
	}
	return projects, nil
}

func (s *MemoryStorage) UpdateProject(project *models.Project) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if _, exists := s.projects[project.ID]; !exists {
		return nil
	}
	s.projects[project.ID] = project
	return nil
}

func (s *MemoryStorage) DeleteProject(id uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	delete(s.projects, id)
	return nil
}

func (s *MemoryStorage) CreateImage(image *models.Image) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if image.ID == uuid.Nil {
		image.ID = uuid.New()
	}
	s.images[image.ID] = image
	return nil
}

func (s *MemoryStorage) GetImageByID(id uuid.UUID) (*models.Image, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	if image, exists := s.images[id]; exists {
		return image, nil
	}
	return nil, nil
}

func (s *MemoryStorage) GetImagesByProjectID(projectID uuid.UUID) ([]*models.Image, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var images []*models.Image
	for _, image := range s.images {
		if image.ProjectID == projectID {
			images = append(images, image)
		}
	}
	return images, nil
}

func (s *MemoryStorage) UpdateImage(image *models.Image) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if _, exists := s.images[image.ID]; !exists {
		return nil
	}
	s.images[image.ID] = image
	return nil
}

func (s *MemoryStorage) DeleteImage(id uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	delete(s.images, id)
	return nil
}