package handlers

import (
	"encoding/json"
	"net/http"

	"agoat.io/agoat-publisher/services"
	"github.com/gorilla/mux"
)

// ThorneHandlers handles Thorne-related HTTP requests
type ThorneHandlers struct {
	thorneService *services.ThorneService
}

// NewThorneHandlers creates a new ThorneHandlers instance
func NewThorneHandlers(thorneService *services.ThorneService) *ThorneHandlers {
	return &ThorneHandlers{
		thorneService: thorneService,
	}
}

// GetProducts returns all products
func (h *ThorneHandlers) GetProducts(w http.ResponseWriter, r *http.Request) {
	products, err := h.thorneService.GetProducts()
	if err != nil {
		http.Error(w, "Failed to load products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    products,
	})
}

// GetProduct returns a single product by ID
func (h *ThorneHandlers) GetProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	productID := vars["id"]

	product, err := h.thorneService.GetProductByID(productID)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    product,
	})
}

// GetCategories returns all categories
func (h *ThorneHandlers) GetCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.thorneService.GetCategories()
	if err != nil {
		http.Error(w, "Failed to load categories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    categories,
	})
}

// GetCategory returns a single category by ID
func (h *ThorneHandlers) GetCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	categoryID := vars["id"]

	category, err := h.thorneService.GetCategoryByID(categoryID)
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    category,
	})
}

// GetProductsByCategory returns products filtered by category
func (h *ThorneHandlers) GetProductsByCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	categoryID := vars["id"]

	products, err := h.thorneService.GetProductsByCategory(categoryID)
	if err != nil {
		http.Error(w, "Failed to load products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    products,
	})
}

// GetPatients returns all patients (admin only)
func (h *ThorneHandlers) GetPatients(w http.ResponseWriter, r *http.Request) {
	patients, err := h.thorneService.GetPatients()
	if err != nil {
		http.Error(w, "Failed to load patients", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    patients,
	})
}

// GetPatient returns a single patient by ID
func (h *ThorneHandlers) GetPatient(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	patientID := vars["id"]

	patient, err := h.thorneService.GetPatientByID(patientID)
	if err != nil {
		http.Error(w, "Patient not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    patient,
	})
}

// RegisterPatient handles patient registration
func (h *ThorneHandlers) RegisterPatient(w http.ResponseWriter, r *http.Request) {
	var registration struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		HealthGoals string `json:"health_goals"`
	}

	if err := json.NewDecoder(r.Body).Decode(&registration); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if registration.Name == "" || registration.Email == "" || registration.HealthGoals == "" {
		http.Error(w, "Name, email, and health goals are required", http.StatusBadRequest)
		return
	}

	patient, err := h.thorneService.RegisterPatient(registration.Name, registration.Email, registration.HealthGoals)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    patient,
		"message": "Registration submitted successfully. You will receive an email once your account is approved.",
	})
}

// GetOrders returns all orders
func (h *ThorneHandlers) GetOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := h.thorneService.GetOrders()
	if err != nil {
		http.Error(w, "Failed to load orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    orders,
	})
}

// GetOrdersByPatient returns orders for a specific patient
func (h *ThorneHandlers) GetOrdersByPatient(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	patientID := vars["id"]

	orders, err := h.thorneService.GetOrdersByPatientID(patientID)
	if err != nil {
		http.Error(w, "Failed to load orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    orders,
	})
}

// CreateOrder handles order creation
func (h *ThorneHandlers) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var orderRequest struct {
		PatientID string `json:"patient_id"`
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&orderRequest); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if orderRequest.PatientID == "" || orderRequest.ProductID == "" || orderRequest.Quantity <= 0 {
		http.Error(w, "Patient ID, product ID, and quantity are required", http.StatusBadRequest)
		return
	}

	order, err := h.thorneService.CreateOrder(orderRequest.PatientID, orderRequest.ProductID, orderRequest.Quantity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    order,
		"message": "Order placed successfully",
	})
}

// GetSettings returns site settings
func (h *ThorneHandlers) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.thorneService.GetSettings()
	if err != nil {
		http.Error(w, "Failed to load settings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    settings,
	})
}

// SearchProducts handles product search
func (h *ThorneHandlers) SearchProducts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Search query is required", http.StatusBadRequest)
		return
	}

	products, err := h.thorneService.SearchProducts(query)
	if err != nil {
		http.Error(w, "Failed to search products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    products,
		"query":   query,
	})
}

// GetProductStats returns product statistics
func (h *ThorneHandlers) GetProductStats(w http.ResponseWriter, r *http.Request) {
	products, err := h.thorneService.GetProducts()
	if err != nil {
		http.Error(w, "Failed to load products", http.StatusInternalServerError)
		return
	}

	// Calculate basic stats
	totalProducts := len(products)
	inStockCount := 0
	categoryCounts := make(map[string]int)

	for _, product := range products {
		if product.InStock {
			inStockCount++
		}
		categoryCounts[product.Category]++
	}

	stats := map[string]interface{}{
		"total_products":  totalProducts,
		"in_stock_count":  inStockCount,
		"out_of_stock":    totalProducts - inStockCount,
		"category_counts": categoryCounts,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    stats,
	})
}
