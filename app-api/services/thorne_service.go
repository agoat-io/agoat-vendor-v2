package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"
	"time"
)

// ThorneProduct represents a Thorne supplement product
type ThorneProduct struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Category       string   `json:"category"`
	ImageURL       string   `json:"image_url"`
	WholesalePrice float64  `json:"wholesale_price"`
	RetailPrice    float64  `json:"retail_price"`
	SKU            string   `json:"sku"`
	InStock        bool     `json:"in_stock"`
	Benefits       []string `json:"benefits"`
	Ingredients    []string `json:"ingredients"`
}

// ThorneCategory represents a product category
type ThorneCategory struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Icon        string   `json:"icon"`
	Benefits    []string `json:"benefits"`
	Color       string   `json:"color"`
}

// Patient represents a registered patient
type Patient struct {
	ID               string     `json:"id"`
	Name             string     `json:"name"`
	Email            string     `json:"email"`
	HealthGoals      string     `json:"health_goals"`
	Approved         bool       `json:"approved"`
	RegistrationDate time.Time  `json:"registration_date"`
	LastLogin        *time.Time `json:"last_login"`
}

// Order represents a patient order
type Order struct {
	ID             string     `json:"id"`
	PatientID      string     `json:"patient_id"`
	ProductID      string     `json:"product_id"`
	ProductName    string     `json:"product_name"`
	Quantity       int        `json:"quantity"`
	UnitPrice      float64    `json:"unit_price"`
	TotalPrice     float64    `json:"total_price"`
	Status         string     `json:"status"`
	Fulfillment    string     `json:"fulfillment"`
	OrderDate      time.Time  `json:"order_date"`
	ShippedDate    *time.Time `json:"shipped_date"`
	TrackingNumber *string    `json:"tracking_number"`
}

// ThorneSettings represents site settings
type ThorneSettings struct {
	SiteName                string            `json:"site_name"`
	PractitionerName        string            `json:"practitioner_name"`
	PractitionerCredentials string            `json:"practitioner_credentials"`
	ContactEmail            string            `json:"contact_email"`
	Phone                   string            `json:"phone"`
	Address                 map[string]string `json:"address"`
	BusinessHours           map[string]string `json:"business_hours"`
	Compliance              map[string]string `json:"compliance"`
	Features                map[string]bool   `json:"features"`
}

// ThorneService handles data operations for Thorne-related functionality
type ThorneService struct {
	configPath string
}

// NewThorneService creates a new ThorneService instance
func NewThorneService(configPath string) *ThorneService {
	return &ThorneService{
		configPath: configPath,
	}
}

// GetProducts returns all products
func (s *ThorneService) GetProducts() ([]ThorneProduct, error) {
	var data struct {
		Products []ThorneProduct `json:"products"`
	}

	err := s.loadJSON("thorne-products.json", &data)
	if err != nil {
		return nil, err
	}

	return data.Products, nil
}

// GetProductByID returns a product by ID
func (s *ThorneService) GetProductByID(id string) (*ThorneProduct, error) {
	products, err := s.GetProducts()
	if err != nil {
		return nil, err
	}

	for _, product := range products {
		if product.ID == id {
			return &product, nil
		}
	}

	return nil, fmt.Errorf("product not found: %s", id)
}

// GetProductsByCategory returns products filtered by category
func (s *ThorneService) GetProductsByCategory(category string) ([]ThorneProduct, error) {
	products, err := s.GetProducts()
	if err != nil {
		return nil, err
	}

	var filtered []ThorneProduct
	for _, product := range products {
		if product.Category == category {
			filtered = append(filtered, product)
		}
	}

	return filtered, nil
}

// GetCategories returns all categories
func (s *ThorneService) GetCategories() ([]ThorneCategory, error) {
	var data struct {
		Categories []ThorneCategory `json:"categories"`
	}

	err := s.loadJSON("thorne-categories.json", &data)
	if err != nil {
		return nil, err
	}

	return data.Categories, nil
}

// GetCategoryByID returns a category by ID
func (s *ThorneService) GetCategoryByID(id string) (*ThorneCategory, error) {
	categories, err := s.GetCategories()
	if err != nil {
		return nil, err
	}

	for _, category := range categories {
		if category.ID == id {
			return &category, nil
		}
	}

	return nil, fmt.Errorf("category not found: %s", id)
}

// GetPatients returns all patients
func (s *ThorneService) GetPatients() ([]Patient, error) {
	var data struct {
		Patients []Patient `json:"patients"`
	}

	err := s.loadJSON("thorne-patients.json", &data)
	if err != nil {
		return nil, err
	}

	return data.Patients, nil
}

// GetPatientByID returns a patient by ID
func (s *ThorneService) GetPatientByID(id string) (*Patient, error) {
	patients, err := s.GetPatients()
	if err != nil {
		return nil, err
	}

	for _, patient := range patients {
		if patient.ID == id {
			return &patient, nil
		}
	}

	return nil, fmt.Errorf("patient not found: %s", id)
}

// GetPatientByEmail returns a patient by email
func (s *ThorneService) GetPatientByEmail(email string) (*Patient, error) {
	patients, err := s.GetPatients()
	if err != nil {
		return nil, err
	}

	for _, patient := range patients {
		if strings.ToLower(patient.Email) == strings.ToLower(email) {
			return &patient, nil
		}
	}

	return nil, fmt.Errorf("patient not found: %s", email)
}

// GetOrders returns all orders
func (s *ThorneService) GetOrders() ([]Order, error) {
	var data struct {
		Orders []Order `json:"orders"`
	}

	err := s.loadJSON("thorne-orders.json", &data)
	if err != nil {
		return nil, err
	}

	return data.Orders, nil
}

// GetOrdersByPatientID returns orders for a specific patient
func (s *ThorneService) GetOrdersByPatientID(patientID string) ([]Order, error) {
	orders, err := s.GetOrders()
	if err != nil {
		return nil, err
	}

	var filtered []Order
	for _, order := range orders {
		if order.PatientID == patientID {
			filtered = append(filtered, order)
		}
	}

	return filtered, nil
}

// GetSettings returns site settings
func (s *ThorneService) GetSettings() (*ThorneSettings, error) {
	var data struct {
		Settings ThorneSettings `json:"settings"`
	}

	err := s.loadJSON("thorne-settings.json", &data)
	if err != nil {
		return nil, err
	}

	return &data.Settings, nil
}

// SearchProducts searches products by name or description
func (s *ThorneService) SearchProducts(query string) ([]ThorneProduct, error) {
	products, err := s.GetProducts()
	if err != nil {
		return nil, err
	}

	query = strings.ToLower(query)
	var results []ThorneProduct

	for _, product := range products {
		if strings.Contains(strings.ToLower(product.Name), query) ||
			strings.Contains(strings.ToLower(product.Description), query) {
			results = append(results, product)
		}
	}

	return results, nil
}

// loadJSON loads and parses a JSON configuration file
func (s *ThorneService) loadJSON(filename string, target interface{}) error {
	filePath := filepath.Join(s.configPath, filename)

	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read config file %s: %v", filename, err)
	}

	err = json.Unmarshal(data, target)
	if err != nil {
		return fmt.Errorf("failed to parse config file %s: %v", filename, err)
	}

	return nil
}

// saveJSON saves data to a JSON configuration file
func (s *ThorneService) saveJSON(filename string, data interface{}) error {
	filePath := filepath.Join(s.configPath, filename)

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal data for %s: %v", filename, err)
	}

	err = ioutil.WriteFile(filePath, jsonData, 0644)
	if err != nil {
		return fmt.Errorf("failed to write config file %s: %v", filename, err)
	}

	return nil
}

// RegisterPatient adds a new patient (in a real app, this would save to database)
func (s *ThorneService) RegisterPatient(name, email, healthGoals string) (*Patient, error) {
	// Check if patient already exists
	existing, _ := s.GetPatientByEmail(email)
	if existing != nil {
		return nil, fmt.Errorf("patient with email %s already exists", email)
	}

	// Generate new patient ID (in real app, use UUID)
	patients, err := s.GetPatients()
	if err != nil {
		return nil, err
	}

	newID := fmt.Sprintf("patient-%03d", len(patients)+1)

	patient := Patient{
		ID:               newID,
		Name:             name,
		Email:            email,
		HealthGoals:      healthGoals,
		Approved:         false,
		RegistrationDate: time.Now(),
		LastLogin:        nil,
	}

	// In a real app, this would save to database
	// For now, we'll just return the patient object
	return &patient, nil
}

// CreateOrder creates a new order (in a real app, this would save to database)
func (s *ThorneService) CreateOrder(patientID, productID string, quantity int) (*Order, error) {
	// Get product details
	product, err := s.GetProductByID(productID)
	if err != nil {
		return nil, err
	}

	// Verify patient exists
	_, err = s.GetPatientByID(patientID)
	if err != nil {
		return nil, err
	}

	// Generate new order ID
	orders, err := s.GetOrders()
	if err != nil {
		return nil, err
	}

	newID := fmt.Sprintf("order-%03d", len(orders)+1)

	order := Order{
		ID:             newID,
		PatientID:      patientID,
		ProductID:      productID,
		ProductName:    product.Name,
		Quantity:       quantity,
		UnitPrice:      product.RetailPrice,
		TotalPrice:     product.RetailPrice * float64(quantity),
		Status:         "pending",
		Fulfillment:    "direct", // Default to direct fulfillment
		OrderDate:      time.Now(),
		ShippedDate:    nil,
		TrackingNumber: nil,
	}

	// In a real app, this would save to database
	return &order, nil
}
