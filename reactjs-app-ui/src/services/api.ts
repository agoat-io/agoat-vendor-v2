import axios from 'axios';
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api';
import type { 
  Post, 
  Site, 
  User, 
  APIResponse, 
  LoginRequest, 
  LoginResponse,
  APIMeta 
} from '../types/api';

// Create axios instance with default config
const apiClient = axios.create({
  withCredentials: true,
  timeout: 10000,
});

// API Service class
class APIService {
  private siteId: string = DEFAULT_SITE_ID;

  setSiteId(siteId: string) {
    this.siteId = siteId;
  }

  getSiteId(): string {
    return this.siteId;
  }

  // Status check
  async checkStatus(): Promise<APIResponse> {
    const response = await apiClient.get(buildApiUrl(API_CONFIG.ENDPOINTS.STATUS));
    return response.data;
  }

  // Sites
  async getSites(): Promise<APIResponse<Site[]>> {
    const response = await apiClient.get(buildApiUrl(API_CONFIG.ENDPOINTS.SITES));
    return response.data;
  }

  async getSite(id: string): Promise<APIResponse<Site>> {
    const response = await apiClient.get(buildApiUrl(API_CONFIG.ENDPOINTS.SITE(id)));
    return response.data;
  }

  async createSite(site: Partial<Site>): Promise<APIResponse<Site>> {
    const response = await apiClient.post(buildApiUrl(API_CONFIG.ENDPOINTS.SITES), site);
    return response.data;
  }

  async updateSite(id: string, site: Partial<Site>): Promise<APIResponse<Site>> {
    const response = await apiClient.put(buildApiUrl(API_CONFIG.ENDPOINTS.SITE(id)), site);
    return response.data;
  }

  async deleteSite(id: string): Promise<APIResponse> {
    const response = await apiClient.delete(buildApiUrl(API_CONFIG.ENDPOINTS.SITE(id)));
    return response.data;
  }

  // Posts for a specific site
  async getPosts(
    siteId: string = this.siteId,
    page: number = 1,
    perPage: number = 10,
    publishedOnly: boolean = false
  ): Promise<APIResponse<Post[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (publishedOnly) {
      params.append('published', 'true');
    }

    const response = await apiClient.get(
      `${buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POSTS(siteId))}?${params}`
    );
    return response.data;
  }

  async getPost(postId: string, siteId: string = this.siteId): Promise<APIResponse<Post>> {
    const response = await apiClient.get(
      buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST(siteId, postId))
    );
    return response.data;
  }

  async getPostBySlug(slug: string, siteId: string = this.siteId): Promise<APIResponse<Post>> {
    const response = await apiClient.get(
      buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST_BY_SLUG(siteId, slug))
    );
    return response.data;
  }

  async createPost(post: Partial<Post>, siteId: string = this.siteId): Promise<APIResponse<Post>> {
    const response = await apiClient.post(
      buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POSTS(siteId)),
      post
    );
    return response.data;
  }

  async updatePost(
    postId: string, 
    post: Partial<Post>, 
    siteId: string = this.siteId
  ): Promise<APIResponse<Post>> {
    const response = await apiClient.put(
      buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST(siteId, postId)),
      post
    );
    return response.data;
  }

  async deletePost(postId: string, siteId: string = this.siteId): Promise<APIResponse> {
    const response = await apiClient.delete(
      buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST(siteId, postId))
    );
    return response.data;
  }

  // Legacy endpoints for backward compatibility
  async getPostsLegacy(page: number = 1, perPage: number = 10): Promise<APIResponse<Post[]>> {
    // Redirect to the current site's posts
    return this.getPosts(this.siteId, page, perPage, false);
  }

  async getPublishedPostsLegacy(page: number = 1, perPage: number = 10): Promise<APIResponse<Post[]>> {
    // Redirect to the current site's published posts
    return this.getPosts(this.siteId, page, perPage, true);
  }
}

// Export singleton instance
export const apiService = new APIService();

// Export for backward compatibility
export default apiService;
