/**
 * Content for the public System Design section (/system-design).
 * Each concept renders at /system-design/<slug>. Inline `backticks` in prose
 * strings are rendered as code.
 */

export type CategoryId =
  "fundamentals" | "traffic" | "data" | "async" | "resilience" | "architecture";

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export interface Concept {
  slug: string;
  title: string;
  category: CategoryId;
  /** One sentence. Also the meta description, so 70–160 characters. */
  summary: string;
  /** Plain-English explanation, one string per paragraph. */
  body: string[];
  /** Request path drawn as boxes joined by arrows. */
  flow: string[];
  useWhen: string[];
  pros: string[];
  cons: string[];
  spring: {
    intro: string;
    /** Maven/Gradle coordinates or config keys, shown above the code. */
    dependencies: string[];
    code: string;
    notes: string[];
  };
  /** One line worth saying out loud in an interview. */
  interviewTip: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "fundamentals",
    label: "Fundamentals",
    blurb: "The vocabulary every design discussion starts with.",
  },
  {
    id: "traffic",
    label: "Traffic and the edge",
    blurb: "Getting requests to the right server, quickly and fairly.",
  },
  {
    id: "data",
    label: "Data and storage",
    blurb: "Storing, finding and copying data as it grows.",
  },
  {
    id: "async",
    label: "Messaging and events",
    blurb: "Doing work later, elsewhere, and exactly once.",
  },
  {
    id: "resilience",
    label: "Resilience",
    blurb: "Staying up when the things you depend on do not.",
  },
  {
    id: "architecture",
    label: "Architecture",
    blurb: "How services are split, found, coordinated and watched.",
  },
];

export const CONCEPTS: Concept[] = [
  // ───────────────────────── Fundamentals ─────────────────────────
  {
    slug: "scalability",
    title: "Scalability",
    category: "fundamentals",
    summary:
      "Vertical vs horizontal scaling explained, why stateless services scale out easily, and how to make a Spring Boot app stateless.",
    body: [
      "Scalability is how well a system keeps working as load grows. There are two ways to add capacity: make one machine bigger (vertical scaling) or add more machines (horizontal scaling).",
      "Vertical scaling is simple because nothing in the code changes, but there is a ceiling on how big one machine can get, and that one machine is still a single point of failure.",
      "Horizontal scaling has no practical ceiling, but it only works cleanly when any instance can serve any request. That means the service must be stateless: sessions, uploads and caches live in shared stores such as Redis, a database or object storage, not in the JVM's memory or local disk.",
    ],
    flow: [
      "Clients",
      "Load balancer",
      "App × N (stateless)",
      "Shared DB / Redis",
    ],
    useWhen: [
      "Traffic is growing or spiky and one instance is near its CPU or memory limit",
      "You need to survive the loss of an instance without downtime",
      "You deploy on Kubernetes or another platform that adds pods automatically",
    ],
    pros: [
      "Horizontal: near-linear capacity and built-in redundancy",
      "Vertical: zero code change, good first step",
    ],
    cons: [
      "Horizontal: forces you to externalize state and handle concurrency",
      "Vertical: hard ceiling, expensive at the top end, still one failure point",
    ],
    spring: {
      intro:
        "Move HTTP sessions out of the JVM with Spring Session so any instance can serve any user. Then you can run as many replicas as you like behind a load balancer.",
      dependencies: [
        "org.springframework.session:spring-session-data-redis",
        "org.springframework.boot:spring-boot-starter-data-redis",
      ],
      code: `# application.yml
spring:
  session:
    store-type: redis      # sessions live in Redis, not in memory
  data:
    redis:
      host: redis
      port: 6379

// Any controller can now read the session on any instance
@GetMapping("/cart")
public Cart cart(HttpSession session) {
    Cart cart = (Cart) session.getAttribute("cart");
    return cart != null ? cart : new Cart();
}`,
      notes: [
        "Avoid `static` mutable fields and in-memory maps that hold user data.",
        "Store uploads in S3 or similar object storage, not on the container's disk.",
        "On Kubernetes, pair this with a HorizontalPodAutoscaler on CPU or request rate.",
      ],
    },
    interviewTip:
      "Say you scale vertically first for simplicity, then go horizontal once the service is stateless.",
  },
  {
    slug: "latency-vs-throughput",
    title: "Latency vs Throughput",
    category: "fundamentals",
    summary:
      "Latency is how long one request takes; throughput is how many finish per second. Learn percentiles and how virtual threads help Spring Boot.",
    body: [
      "Latency is the time one request takes from start to finish. Throughput is how many requests the system completes per second. They are related but not the same: a system can have high throughput and still make some users wait a long time.",
      "Averages hide pain. Measure latency in percentiles: p50 is the typical request, p99 is the slowest one in a hundred. At scale, that one in a hundred is thousands of real users, so targets are usually set on p95 or p99.",
      "Most backend latency is waiting: for the database, another service or the network. Classic thread-per-request servers run out of threads while they wait, which caps throughput. Java 21 virtual threads make waiting cheap, so the same hardware handles far more concurrent requests.",
    ],
    flow: ["Request", "Queue wait", "App work", "DB / remote I/O", "Response"],
    useWhen: [
      "Setting SLOs, for example p99 under 300 ms",
      "Deciding between optimizing a hot path and adding capacity",
      "Diagnosing why the service slows down under load",
    ],
    pros: [
      "Percentiles reveal tail latency that averages hide",
      "Separating the two metrics tells you whether to optimize code or add capacity",
    ],
    cons: [
      "Batching raises throughput but adds latency to each item",
      "Tail latency multiplies when one request fans out to many services",
    ],
    spring: {
      intro:
        "Turn on virtual threads (Spring Boot 3.2+ on Java 21) and publish latency histograms through Micrometer so you can graph p95 and p99.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-actuator",
        "io.micrometer:micrometer-registry-prometheus",
      ],
      code: `# application.yml
spring:
  threads:
    virtual:
      enabled: true          # one cheap virtual thread per request

management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true   # enables p95/p99 in Prometheus`,
      notes: [
        "Virtual threads help I/O-bound work. They do not speed up CPU-bound code.",
        "Avoid long `synchronized` blocks around I/O, which can pin a virtual thread to its carrier thread.",
      ],
    },
    interviewTip:
      "Always quote latency as a percentile, and say which one you are optimizing.",
  },
  {
    slug: "cap-theorem",
    title: "CAP Theorem",
    category: "fundamentals",
    summary:
      "During a network partition a distributed store must choose consistency or availability. See how CAP and PACELC shape real database choices.",
    body: [
      "CAP says that a distributed data store can promise at most two of three things: Consistency (every read sees the latest write), Availability (every request gets a non-error answer) and Partition tolerance (it keeps working when the network splits nodes apart).",
      "Networks do fail, so partition tolerance is not optional. The real choice is what happens during a partition: refuse some requests to stay consistent (CP), or keep answering with possibly stale data (AP).",
      "PACELC adds the everyday case: Else, when there is no partition, you still trade Latency against Consistency. Waiting for replicas to agree is slower than answering from the nearest one.",
    ],
    flow: ["Client", "Node A", "✕ partition ✕", "Node B"],
    useWhen: [
      "Choosing a database for a feature",
      "Deciding what a user should see when a region is cut off",
      "Explaining why a read returned old data",
    ],
    pros: [
      "CP (for example Postgres primary, etcd, ZooKeeper): no conflicting writes",
      "AP (for example Cassandra, DynamoDB default reads): always answers, low latency",
    ],
    cons: [
      "CP: some requests fail during a partition",
      "AP: clients may read stale data and conflicts must be resolved",
    ],
    spring: {
      intro:
        "The choice often shows up as configuration. With Spring Data Cassandra you pick a consistency level per query: QUORUM leans toward consistency, ONE toward availability and speed.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-data-cassandra",
      ],
      code: `public interface OrderRepository extends CassandraRepository<Order, UUID> {

    // Strong-ish: a majority of replicas must agree
    @Consistency(DefaultConsistencyLevel.QUORUM)
    Optional<Order> findById(UUID id);

    // Fast and available: any one replica may answer
    @Consistency(DefaultConsistencyLevel.ONE)
    List<Order> findByCustomerId(UUID customerId);
}`,
      notes: [
        "Reads and writes at QUORUM together give read-your-writes consistency.",
        "Payments and inventory usually want CP; feeds, likes and analytics are fine as AP.",
      ],
    },
    interviewTip:
      "Do not say “we pick CA”. Say which way you lean during a partition and why it fits the feature.",
  },
  {
    slug: "consistency-models",
    title: "Consistency Models",
    category: "fundamentals",
    summary:
      "Strong, eventual, read-your-writes and causal consistency compared, plus how Spring transactions and isolation levels give you guarantees.",
    body: [
      "A consistency model is the promise a system makes about what a read can return after a write. Strong consistency means every read sees the latest committed write, as if there were one copy of the data.",
      "Eventual consistency means replicas converge if writes stop, but a read right after a write might see the old value. Between the two sit useful middle grounds: read-your-writes (you always see your own changes) and causal consistency (if B was caused by A, nobody sees B without A).",
      "Inside one relational database, the same idea appears as transaction isolation levels: READ COMMITTED, REPEATABLE READ and SERIALIZABLE trade concurrency for stronger guarantees.",
    ],
    flow: ["Write", "Primary", "async copy", "Replica", "Read (maybe stale)"],
    useWhen: [
      "Money, stock levels and unique usernames need strong guarantees",
      "Counters, timelines and search indexes can be eventually consistent",
      "Users must always see their own edits immediately",
    ],
    pros: [
      "Strong: simple to reason about, no surprising reads",
      "Eventual: fast, available, easy to replicate globally",
    ],
    cons: [
      "Strong: higher latency and lower availability across regions",
      "Eventual: app code must tolerate stale and out-of-order data",
    ],
    spring: {
      intro:
        "Spring's `@Transactional` controls the isolation level. Use the strongest level only where it matters, because it costs throughput.",
      dependencies: ["org.springframework.boot:spring-boot-starter-data-jpa"],
      code: `@Service
public class TransferService {

    private final AccountRepository accounts;

    public TransferService(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void transfer(long from, long to, BigDecimal amount) {
        Account a = accounts.findById(from).orElseThrow();
        Account b = accounts.findById(to).orElseThrow();
        a.debit(amount);
        b.credit(amount);
    }   // commit or roll back as one unit
}`,
      notes: [
        "Postgres's default is READ COMMITTED; SERIALIZABLE may throw serialization errors that you should retry.",
        "Optimistic locking with a JPA `@Version` field is a cheap alternative for most edit conflicts.",
      ],
    },
    interviewTip:
      "Match the model to the feature: strong for money, read-your-writes for profiles, eventual for feeds.",
  },

  // ───────────────────────── Traffic ─────────────────────────
  {
    slug: "load-balancing",
    title: "Load Balancing",
    category: "traffic",
    summary:
      "How a load balancer spreads traffic across instances, round robin vs least connections, health checks, and client-side balancing in Spring Cloud.",
    body: [
      "A load balancer sits in front of several identical servers and decides which one handles each request. It spreads the work, hides individual servers from clients and stops sending traffic to servers that fail their health checks.",
      "Layer 4 balancers route on IP and port and are very fast. Layer 7 balancers read the HTTP request, so they can route by path or header, terminate TLS and retry safely.",
      "Common algorithms: round robin (take turns), least connections (pick the least busy), weighted (bigger servers get more), and consistent hashing (the same key always lands on the same server, useful for caches).",
    ],
    flow: ["Client", "Load balancer", "App 1 · App 2 · App 3"],
    useWhen: [
      "You run more than one instance of a service",
      "You want zero-downtime deploys by draining one instance at a time",
      "You need TLS termination or path-based routing in one place",
    ],
    pros: [
      "Removes a single server as a point of failure",
      "Lets you add or remove capacity without clients noticing",
    ],
    cons: [
      "The balancer itself must be redundant",
      "Sticky sessions undo much of the benefit; prefer stateless apps",
    ],
    spring: {
      intro:
        "In production you usually use a managed balancer (AWS ALB, NGINX, a Kubernetes Service). For service-to-service calls, Spring Cloud LoadBalancer picks an instance on the client side.",
      dependencies: [
        "org.springframework.cloud:spring-cloud-starter-loadbalancer",
        "org.springframework.boot:spring-boot-starter-actuator",
      ],
      code: `@Configuration
public class HttpConfig {

    @Bean
    @LoadBalanced                 // resolves "inventory-service" to a live instance
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}

@Service
public class InventoryClient {
    private final RestClient http;

    public InventoryClient(RestClient.Builder builder) {
        this.http = builder.baseUrl("http://inventory-service").build();
    }

    public int stock(String sku) {
        return http.get().uri("/stock/{sku}", sku)
                   .retrieve().body(Integer.class);
    }
}`,
      notes: [
        "Point the balancer's health check at `/actuator/health/readiness`.",
        "Enable `server.shutdown=graceful` so in-flight requests finish during deploys.",
      ],
    },
    interviewTip:
      "Mention health checks and graceful shutdown, not just the algorithm.",
  },
  {
    slug: "api-gateway",
    title: "API Gateway",
    category: "traffic",
    summary:
      "An API gateway is the single front door for microservices: routing, auth, rate limits and CORS in one place. Built here with Spring Cloud Gateway.",
    body: [
      "An API gateway is one entry point that sits in front of many backend services. Clients talk to the gateway; the gateway forwards each request to the right service.",
      "Because every request passes through it, the gateway is the natural place for cross-cutting work: checking tokens, rate limiting, CORS, request logging, adding correlation IDs and rewriting paths.",
      "A variant is Backend-for-Frontend (BFF): a separate gateway per client type, such as web and mobile, each shaped for what that client needs.",
    ],
    flow: ["Web / Mobile", "API gateway", "Users · Orders · Payments"],
    useWhen: [
      "You have several services and do not want clients to know their addresses",
      "Authentication and rate limiting should be enforced in one place",
      "You need to version or reshape APIs without changing services",
    ],
    pros: [
      "One place for security and policies",
      "Services can move or split without breaking clients",
    ],
    cons: [
      "An extra network hop on every request",
      "Can become a bottleneck or a dumping ground for business logic",
    ],
    spring: {
      intro:
        "Spring Cloud Gateway is built on Spring WebFlux and routes with predicates (what to match) and filters (what to do).",
      dependencies: ["org.springframework.cloud:spring-cloud-starter-gateway"],
      code: `@Configuration
public class GatewayRoutes {

    @Bean
    RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("orders", r -> r.path("/api/orders/**")
                .filters(f -> f
                    .stripPrefix(1)                         // /api/orders -> /orders
                    .addRequestHeader("X-Gateway", "edge")
                    .circuitBreaker(c -> c.setName("orders")
                        .setFallbackUri("forward:/fallback/orders")))
                .uri("lb://order-service"))                 // load-balanced
            .route("users", r -> r.path("/api/users/**")
                .filters(f -> f.stripPrefix(1))
                .uri("lb://user-service"))
            .build();
    }
}`,
      notes: [
        "Validate JWTs at the gateway with `spring-boot-starter-oauth2-resource-server`.",
        "Keep business rules in services. The gateway should only route and enforce policy.",
      ],
    },
    interviewTip:
      "Say what the gateway owns (auth, limits, routing) and what it must not own (business logic).",
  },
  {
    slug: "rate-limiting",
    title: "Rate Limiting",
    category: "traffic",
    summary:
      "Protect APIs from abuse and overload with token bucket and sliding window rate limits, implemented in Spring Boot with Bucket4j and Redis.",
    body: [
      "Rate limiting caps how many requests a client may make in a time window. It protects your service from abuse, runaway scripts and one noisy customer starving everyone else.",
      "The token bucket algorithm is the most common: a bucket holds up to N tokens, refills at a steady rate, and each request spends one. Bursts are allowed up to the bucket size, while the long-run rate stays fixed. Sliding window counters are a simpler alternative.",
      "With several instances, the counters must live in a shared store such as Redis, otherwise each instance enforces its own separate limit. Rejected requests get HTTP 429 with a Retry-After header.",
    ],
    flow: ["Client", "Limiter (Redis bucket)", "429 or → API"],
    useWhen: [
      "Public APIs and login endpoints",
      "Per-plan quotas, for example free vs paid tiers",
      "Protecting an expensive downstream such as an AI or payment API",
    ],
    pros: [
      "Keeps the service up under abuse or bugs in clients",
      "Makes capacity fair across customers",
    ],
    cons: [
      "A distributed limiter adds a Redis call per request",
      "Limits that are too tight block real users",
    ],
    spring: {
      intro:
        "Bucket4j implements token buckets. This filter gives each API key 100 requests per minute with bursts of up to 20 extra.",
      dependencies: ["com.bucket4j:bucket4j_jdk17-core"],
      code: `@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        return Bucket.builder()
            .addLimit(limit -> limit.capacity(120)
                .refillGreedy(100, Duration.ofMinutes(1)))
            .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {
        String key = Optional.ofNullable(req.getHeader("X-API-Key"))
                             .orElse(req.getRemoteAddr());
        Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());

        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429);
            res.setHeader("Retry-After", "60");
        }
    }
}`,
      notes: [
        "This in-memory map is per instance. Use Bucket4j's Redis integration (bucket4j-redis) for a shared limit.",
        "Resilience4j's `@RateLimiter` limits outgoing calls you make, not incoming traffic.",
      ],
    },
    interviewTip:
      "Name the algorithm, where the counter lives, and what the client sees when limited (429 + Retry-After).",
  },
  {
    slug: "cdn",
    title: "CDN and Edge Caching",
    category: "traffic",
    summary:
      "A content delivery network serves files from servers near your users. Learn cache headers, invalidation and how Spring Boot sets Cache-Control.",
    body: [
      "A content delivery network (CDN) is a worldwide set of servers that keep copies of your content close to users. A user in Tokyo gets an image from a Tokyo edge server instead of your origin in Virginia.",
      "CDNs are best for static assets such as JavaScript, CSS, images and video, but they can also cache public API responses. Your origin controls what is cached and for how long with the Cache-Control header.",
      "The hard part is invalidation. The usual trick is to put a content hash in file names (app.3f9a.js) and cache them forever, so a new deploy simply uses new names.",
    ],
    flow: ["User", "Nearest edge", "miss → Origin (Spring Boot)"],
    useWhen: [
      "Serving static assets to users in many regions",
      "Public, rarely changing API responses such as product catalogs",
      "Absorbing traffic spikes and some DDoS traffic before it reaches you",
    ],
    pros: [
      "Much lower latency for distant users",
      "Big reduction in origin load and bandwidth",
    ],
    cons: [
      "Stale content until the TTL expires or you purge",
      "Never cache personalized responses publicly",
    ],
    spring: {
      intro:
        "Spring Boot can fingerprint static files and set long cache headers, and controllers can set Cache-Control on API responses.",
      dependencies: ["org.springframework.boot:spring-boot-starter-web"],
      code: `# application.yml: hashed file names + 1 year cache for static assets
spring:
  web:
    resources:
      chain:
        strategy:
          content:
            enabled: true
            paths: /**
      cache:
        cachecontrol:
          max-age: 365d
          cache-public: true

// Public API response cacheable at the edge for 5 minutes
@GetMapping("/api/catalog")
public ResponseEntity<List<Product>> catalog() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
        .body(catalogService.all());
}`,
      notes: [
        "Use `CacheControl.noStore()` or `cachePrivate()` for anything user-specific.",
        "Return an ETag (`ShallowEtagHeaderFilter`) so clients can revalidate cheaply.",
      ],
    },
    interviewTip:
      "Mention cache keys, TTLs and how you invalidate, not just “put a CDN in front”.",
  },

  // ───────────────────────── Data ─────────────────────────
  {
    slug: "caching",
    title: "Caching",
    category: "data",
    summary:
      "Cache-aside, write-through and TTLs explained, with Spring Cache and Redis examples for speeding up reads without serving wrong data.",
    body: [
      "A cache keeps the answer to an expensive question in fast memory so the next request can skip the slow work. Reading from Redis takes well under a millisecond; a complex database query can take hundreds.",
      "The most common pattern is cache-aside: check the cache, on a miss read the database and store the result. Write-through updates the cache on every write; write-behind writes to the cache first and to the database later.",
      "Every cache needs an answer to two questions: when does an entry expire (TTL) and what happens when the data changes (eviction). Watch out for a cache stampede, where a popular key expires and thousands of requests hit the database at once.",
    ],
    flow: ["Request", "Redis cache", "miss → Database", "store in cache"],
    useWhen: [
      "The same data is read far more often than it changes",
      "A query or remote call is slow or expensive",
      "Slightly stale data is acceptable for a short time",
    ],
    pros: [
      "Huge latency improvement for hot data",
      "Takes load off the database",
    ],
    cons: [
      "Stale data and tricky invalidation",
      "Another system to run and monitor",
    ],
    spring: {
      intro:
        "Spring's cache abstraction adds caching with annotations. Back it with Redis so every instance shares one cache.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-cache",
        "org.springframework.boot:spring-boot-starter-data-redis",
      ],
      code: `@SpringBootApplication
@EnableCaching
public class ShopApplication { }

@Service
public class ProductService {

    private final ProductRepository repo;

    public ProductService(ProductRepository repo) { this.repo = repo; }

    @Cacheable(cacheNames = "products", key = "#id", sync = true)
    public Product find(long id) {             // only runs on a cache miss
        return repo.findById(id).orElseThrow();
    }

    @CachePut(cacheNames = "products", key = "#result.id")
    public Product update(Product p) {         // refresh cache on write
        return repo.save(p);
    }

    @CacheEvict(cacheNames = "products", key = "#id")
    public void delete(long id) {
        repo.deleteById(id);
    }
}

# application.yml
spring:
  cache:
    redis:
      time-to-live: 10m`,
      notes: [
        "`sync = true` lets only one thread load a missing key, which helps against stampedes.",
        "Annotations only work through the Spring proxy; calling a cached method from the same class skips the cache.",
        "Caffeine is a great in-process cache for small, per-instance data.",
      ],
    },
    interviewTip:
      "Say the pattern (cache-aside), the TTL, and how you invalidate on writes.",
  },
  {
    slug: "database-indexing",
    title: "Database Indexing",
    category: "data",
    summary:
      "How B-tree indexes speed up lookups, composite index column order, the write cost of indexes, and declaring them in JPA and Flyway.",
    body: [
      "An index is a sorted lookup structure, usually a B-tree, that lets the database jump straight to matching rows instead of scanning the whole table. It is like the index at the back of a book.",
      "Composite indexes cover several columns, and the order matters: an index on (customer_id, created_at) helps queries that filter by customer, or by customer and date, but not by date alone.",
      "Indexes are not free. Every insert and update must also update each index, and they take disk and memory. Add them for real query patterns, then confirm with EXPLAIN.",
    ],
    flow: ["Query", "B-tree index", "Row location", "Table row"],
    useWhen: [
      "Columns used in WHERE, JOIN and ORDER BY on large tables",
      "Foreign keys you join on",
      "Unique constraints such as email",
    ],
    pros: [
      "Turns full scans into fast lookups",
      "Unique indexes enforce data rules",
    ],
    cons: [
      "Slower writes and extra storage",
      "Unused or duplicate indexes are pure cost",
    ],
    spring: {
      intro:
        "Declare indexes on the entity for documentation, but create them with a migration tool such as Flyway so production schema changes are versioned.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-data-jpa",
        "org.flywaydb:flyway-core",
      ],
      code: `@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_customer_created",
           columnList = "customer_id, created_at")
})
public class Order {
    @Id @GeneratedValue private Long id;
    @Column(name = "customer_id") private Long customerId;
    @Column(name = "created_at")  private Instant createdAt;
}

-- src/main/resources/db/migration/V7__orders_customer_index.sql
CREATE INDEX CONCURRENTLY idx_orders_customer_created
    ON orders (customer_id, created_at DESC);

// Uses the index: filter on the leading column, sort on the second
List<Order> findTop20ByCustomerIdOrderByCreatedAtDesc(Long customerId);`,
      notes: [
        "Set `spring.jpa.hibernate.ddl-auto=validate` in production; let Flyway own the schema.",
        "`CREATE INDEX CONCURRENTLY` avoids locking writes in Postgres, but must run outside a transaction.",
        "Turn on `spring.jpa.show-sql` locally and run EXPLAIN ANALYZE on slow queries.",
      ],
    },
    interviewTip:
      "Tie each index to a specific query, and mention the write cost.",
  },
  {
    slug: "replication",
    title: "Database Replication",
    category: "data",
    summary:
      "Primary and read replicas, synchronous vs asynchronous replication, replica lag, and routing read-only Spring transactions to replicas.",
    body: [
      "Replication keeps copies of the same data on several database servers. In the common primary–replica setup, all writes go to the primary and are copied to one or more read replicas.",
      "Replicas give you two things: more read capacity, and a standby that can be promoted if the primary dies. Synchronous replication waits for a replica before confirming a write (safer, slower); asynchronous does not (faster, but recent writes can be lost on failover).",
      "Asynchronous replicas lag slightly behind. If a user saves something and the next read goes to a replica, they may not see their change, so route reads that must be fresh to the primary.",
    ],
    flow: ["Writes", "Primary", "replicate", "Replica 1 · Replica 2", "Reads"],
    useWhen: [
      "Reads far outnumber writes",
      "You need fast failover for high availability",
      "Reporting queries should not slow down the main database",
    ],
    pros: [
      "Scales reads and adds redundancy",
      "Analytics can run on a replica",
    ],
    cons: [
      "Replica lag causes stale reads",
      "Does not scale writes; that needs sharding",
    ],
    spring: {
      intro:
        "Route `@Transactional(readOnly = true)` methods to a replica with Spring's `AbstractRoutingDataSource`, wrapped in a lazy proxy so the choice is made when the transaction starts.",
      dependencies: ["org.springframework.boot:spring-boot-starter-jdbc"],
      code: `public class ReadWriteRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
            ? "replica" : "primary";
    }
}

@Configuration
public class DataSourceConfig {
    @Bean
    @Primary
    DataSource dataSource(@Qualifier("primaryDs") DataSource primary,
                          @Qualifier("replicaDs") DataSource replica) {
        var routing = new ReadWriteRoutingDataSource();
        routing.setTargetDataSources(Map.of("primary", primary, "replica", replica));
        routing.setDefaultTargetDataSource(primary);
        routing.afterPropertiesSet();
        return new LazyConnectionDataSourceProxy(routing);
    }
}

@Transactional(readOnly = true)   // goes to the replica
public List<Order> history(long customerId) { ... }`,
      notes: [
        "Without `LazyConnectionDataSourceProxy` the connection is picked before the read-only flag is set.",
        "Send read-after-write flows, such as “show my order right after checkout”, to the primary.",
      ],
    },
    interviewTip: "Bring up replica lag and how you handle read-your-writes.",
  },
  {
    slug: "sharding",
    title: "Sharding and Partitioning",
    category: "data",
    summary:
      "Split data across databases to scale writes: choosing a shard key, hash vs range sharding, hot spots, and routing shards in Spring Boot.",
    body: [
      "Sharding splits one large dataset across several databases, each holding part of the rows. It is how you scale writes and storage once a single primary is not enough.",
      "Everything depends on the shard key. Hash sharding (hash of user_id) spreads load evenly; range sharding (by date or ID range) keeps related rows together but can create hot spots. Consistent hashing reduces how much data moves when you add a shard.",
      "Queries that include the shard key go to one shard and stay fast. Queries without it must ask every shard, and joins or transactions across shards become hard. Partitioning inside one database, for example Postgres table partitions, is a lighter first step.",
    ],
    flow: ["Request (userId)", "Shard router", "Shard 0 · Shard 1 · Shard 2"],
    useWhen: [
      "Write volume or data size exceeds one primary",
      "Data naturally splits by tenant, user or region",
      "You have already tried indexing, caching and replicas",
    ],
    pros: [
      "Scales writes and storage nearly linearly",
      "Smaller indexes per shard, faster queries",
    ],
    cons: [
      "Cross-shard queries, joins and transactions are hard",
      "Resharding is painful; pick the key carefully",
    ],
    spring: {
      intro:
        "The same routing data source idea works for shards: pick the target from a key in a request-scoped context. Libraries such as Apache ShardingSphere do this for you.",
      dependencies: ["org.springframework.boot:spring-boot-starter-jdbc"],
      code: `public final class ShardContext {
    private static final ThreadLocal<Integer> SHARD = new ThreadLocal<>();
    public static void set(long userId, int shards) {
        SHARD.set(Math.floorMod(Long.hashCode(userId), shards));
    }
    public static Integer get() { return SHARD.get(); }
    public static void clear() { SHARD.remove(); }
}

public class ShardRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return ShardContext.get();          // 0, 1, 2 ...
    }
}

@Service
public class ProfileService {
    public Profile load(long userId) {
        ShardContext.set(userId, 3);
        try {
            return profileRepository.findById(userId).orElseThrow();
        } finally {
            ShardContext.clear();            // never leak to the next request
        }
    }
}`,
      notes: [
        "Generate IDs that are unique across shards, for example UUIDv7 or a Snowflake-style generator.",
        "Consider Postgres partitioning or a distributed SQL database before hand-rolled sharding.",
      ],
    },
    interviewTip:
      "Justify the shard key with the main query pattern, and name the hot-spot risk.",
  },
  {
    slug: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    category: "data",
    summary:
      "When to choose a relational database or a document, key-value, wide-column or graph store, with the matching Spring Data module for each.",
    body: [
      "Relational (SQL) databases store data in tables with a fixed schema, enforce relationships, and support ACID transactions and flexible joins. They are the safe default for most business data.",
      "NoSQL is a family, not one thing. Document stores (MongoDB) keep nested JSON-like records; key-value stores (Redis, DynamoDB) do fast lookups by key; wide-column stores (Cassandra) handle huge write volumes; graph databases (Neo4j) model relationships.",
      "Choose from the access patterns. If you need ad-hoc queries and strong transactions, start with SQL. If you know exactly how data will be read and need massive scale or a flexible shape, a NoSQL store may fit better. Many systems use both.",
    ],
    flow: ["Access pattern", "Pick a model", "Spring Data module"],
    useWhen: [
      "SQL: orders, payments, users, anything relational and transactional",
      "Document: content and catalogs with varying fields",
      "Key-value / wide-column: sessions, carts, time series, very high write rates",
    ],
    pros: [
      "SQL: joins, constraints, transactions, mature tooling",
      "NoSQL: horizontal scale and flexible schemas",
    ],
    cons: [
      "SQL: scaling writes beyond one node takes work",
      "NoSQL: weaker transactions and you must design for each query up front",
    ],
    spring: {
      intro:
        "Spring Data gives every store the same repository style, so switching models changes annotations more than code.",
      dependencies: [
        "spring-boot-starter-data-jpa (Postgres, MySQL)",
        "spring-boot-starter-data-mongodb",
        "spring-boot-starter-data-redis",
        "spring-boot-starter-data-cassandra",
      ],
      code: `// Relational (JPA)
@Entity
public class Customer {
    @Id @GeneratedValue Long id;
    String email;
}
interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
}

// Document (MongoDB): nested data in one record
@Document("products")
public record Product(@Id String id, String name,
                      Map<String, String> attributes,
                      List<Review> reviews) { }
interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByAttributesColor(String color);
}`,
      notes: [
        "Postgres's JSONB column covers many “I need a flexible schema” cases without a second database.",
        "Polyglot persistence is fine, but each extra database is one more thing to back up and run.",
      ],
    },
    interviewTip:
      "Choose based on access patterns and consistency needs, not on popularity.",
  },
  {
    slug: "connection-pooling",
    title: "Connection Pooling",
    category: "data",
    summary:
      "Why opening database connections is slow, how a pool reuses them, and how to size and tune HikariCP in Spring Boot without starving the DB.",
    body: [
      "Opening a database connection is expensive: a network handshake, authentication and memory on the database server. A connection pool opens a fixed set of connections once and lends them to requests.",
      "Bigger is not better. The database can only run so many queries at once, so a pool far larger than its CPU count just adds contention. A good starting point is roughly (CPU cores × 2) + effective disk spindles on the database server.",
      "Remember the multiplier: 20 instances × 30 connections each is 600 connections hitting one database. Use a proxy such as PgBouncer or RDS Proxy when instance counts grow.",
    ],
    flow: ["Request threads", "HikariCP pool (N conns)", "Database"],
    useWhen: [
      "Always, for any app talking to a relational database",
      "Tuning when you see connection timeout errors under load",
    ],
    pros: [
      "Removes per-request connection setup cost",
      "Caps load on the database",
    ],
    cons: [
      "Pool exhaustion makes requests wait or fail",
      "Total connections grow with instance count",
    ],
    spring: {
      intro:
        "Spring Boot uses HikariCP by default. Set the pool size and timeouts explicitly and expose pool metrics.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-jdbc (includes HikariCP)",
      ],
      code: `# application.yml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/shop
    hikari:
      maximum-pool-size: 10        # per instance
      minimum-idle: 10             # fixed-size pool is predictable
      connection-timeout: 3000     # ms to wait for a free connection
      max-lifetime: 1800000        # recycle before the DB or proxy kills it
      leak-detection-threshold: 20000

# Metrics: hikaricp_connections_active, hikaricp_connections_pending
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus`,
      notes: [
        "Keep transactions short and never call remote HTTP APIs while holding a connection.",
        "Turn off `spring.jpa.open-in-view` so connections are not held for the whole web request.",
      ],
    },
    interviewTip:
      "Explain total connections = instances × pool size, and how you keep it below the database limit.",
  },

  // ───────────────────────── Async ─────────────────────────
  {
    slug: "message-queues",
    title: "Message Queues",
    category: "async",
    summary:
      "Decouple services and absorb spikes with queues. Kafka vs RabbitMQ, delivery guarantees, dead-letter queues and Spring for Kafka examples.",
    body: [
      "A message queue lets one service hand work to another without waiting for it. The producer puts a message on the queue and moves on; a consumer picks it up when it is ready.",
      "This decouples services (the consumer can be down for a while), smooths spikes (the queue buffers bursts) and lets you add consumers to process faster. RabbitMQ is a classic broker with flexible routing; Kafka is a durable, replayable log that handles very high throughput.",
      "Most systems give at-least-once delivery, so a message can arrive twice and consumers must be idempotent. Messages that keep failing go to a dead-letter queue for inspection instead of blocking the line.",
    ],
    flow: ["Producer", "Queue / Topic", "Consumer group", "DLQ on failure"],
    useWhen: [
      "Work does not need to finish before you respond, such as emails or thumbnails",
      "Traffic is bursty and the downstream is slower",
      "Several services need to react to the same event",
    ],
    pros: [
      "Loose coupling and better fault isolation",
      "Natural back-pressure and load leveling",
    ],
    cons: [
      "Eventual consistency and harder debugging",
      "Duplicates and ordering need explicit handling",
    ],
    spring: {
      intro:
        "Spring for Apache Kafka sends with `KafkaTemplate` and consumes with `@KafkaListener`. Retries and a dead-letter topic take one annotation.",
      dependencies: ["org.springframework.kafka:spring-kafka"],
      code: `@Service
public class OrderEvents {
    private final KafkaTemplate<String, OrderPlaced> kafka;

    public OrderEvents(KafkaTemplate<String, OrderPlaced> kafka) {
        this.kafka = kafka;
    }

    public void publish(OrderPlaced event) {
        // key = orderId keeps all events for one order in order
        kafka.send("orders.placed", event.orderId(), event);
    }
}

@Component
public class EmailConsumer {

    @RetryableTopic(attempts = "4",
                    backoff = @Backoff(delay = 1000, multiplier = 2))
    @KafkaListener(topics = "orders.placed", groupId = "email")
    public void onOrder(OrderPlaced event) {
        emailService.sendConfirmation(event);
    }

    @DltHandler
    public void deadLetter(OrderPlaced event) {
        log.error("Gave up on order {}", event.orderId());
    }
}`,
      notes: [
        "Kafka keeps order only within a partition, so choose the message key deliberately.",
        "For RabbitMQ, use `spring-boot-starter-amqp` with `RabbitTemplate` and `@RabbitListener`.",
      ],
    },
    interviewTip:
      "State the delivery guarantee, how consumers handle duplicates, and where poison messages go.",
  },
  {
    slug: "event-driven-architecture",
    title: "Event-Driven Architecture",
    category: "async",
    summary:
      "Services publish facts about what happened and others react. Events vs commands, choreography, and Spring application and Kafka events.",
    body: [
      "In an event-driven system, services announce facts about things that already happened, such as OrderPlaced or PaymentFailed, and any interested service reacts. The publisher does not know or care who is listening.",
      "That is different from a command (“ChargeCard”), which asks one specific service to do something. Events reduce coupling: adding a new reaction means adding a new subscriber, not changing the publisher.",
      "The cost is visibility. A business flow is spread across many handlers, so you need good tracing, clear event names and versioned event schemas.",
    ],
    flow: ["Order service", "OrderPlaced event", "Billing · Shipping · Email"],
    useWhen: [
      "Several teams need to react to the same business moments",
      "You want to add features without touching existing services",
      "Building audit logs, analytics or read models from changes",
    ],
    pros: [
      "Loose coupling and easy extension",
      "Natural audit trail of what happened",
    ],
    cons: [
      "Flows are harder to follow and debug",
      "Eventual consistency and schema evolution to manage",
    ],
    spring: {
      intro:
        "Start inside one service with Spring application events. `@TransactionalEventListener` only fires after the database commit, so listeners never see rolled-back data.",
      dependencies: [
        "spring-context (built in)",
        "spring-kafka for cross-service events",
      ],
      code: `public record OrderPlaced(String orderId, String customerId) { }

@Service
public class OrderService {
    private final ApplicationEventPublisher events;
    private final OrderRepository orders;

    public OrderService(ApplicationEventPublisher events, OrderRepository orders) {
        this.events = events;
        this.orders = orders;
    }

    @Transactional
    public Order place(Cart cart) {
        Order order = orders.save(Order.from(cart));
        events.publishEvent(new OrderPlaced(order.getId(), order.getCustomerId()));
        return order;
    }
}

@Component
public class LoyaltyPoints {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void on(OrderPlaced e) {
        // award points without slowing down checkout
    }
}`,
      notes: [
        "In-process events are lost if the app crashes after commit; use the outbox pattern for cross-service events.",
        "Spring Modulith adds a persistent event registry for in-process events.",
      ],
    },
    interviewTip:
      "Name events in the past tense and say how you trace a flow across services.",
  },
  {
    slug: "idempotency",
    title: "Idempotency",
    category: "async",
    summary:
      "Make retries safe so a repeated request never charges twice. Idempotency keys, unique constraints and a Spring Boot example.",
    body: [
      "An operation is idempotent if doing it twice has the same effect as doing it once. GET, PUT and DELETE are idempotent by design; POST usually is not.",
      "In distributed systems retries are everywhere: clients retry on timeouts, queues redeliver messages, load balancers resend. Without idempotency, a retry can charge a card twice or create a duplicate order.",
      "The standard fix is an idempotency key: the client sends a unique ID with the request, the server records it with the result, and any repeat with the same key returns the saved result instead of doing the work again.",
    ],
    flow: [
      "Client + Idempotency-Key",
      "Seen before?",
      "yes → saved result / no → process",
    ],
    useWhen: [
      "Payment, order and booking APIs",
      "Any message consumer under at-least-once delivery",
      "Webhooks from third parties, which are often sent more than once",
    ],
    pros: [
      "Makes retries safe and simple",
      "Protects against double clicks and network blips",
    ],
    cons: [
      "Extra storage and a lookup per request",
      "Keys need an expiry policy",
    ],
    spring: {
      intro:
        "Store the key in a table with a unique constraint. The database guarantees only one request with that key can win, even across instances.",
      dependencies: ["org.springframework.boot:spring-boot-starter-data-jpa"],
      code: `@Entity
@Table(name = "idempotency_keys")
public class IdempotencyRecord {
    @Id private String key;            // primary key = unique
    private String responseJson;
    private Instant createdAt = Instant.now();
    // constructors, getters
}

@RestController
public class PaymentController {

    @PostMapping("/payments")
    @Transactional
    public ResponseEntity<String> pay(@RequestHeader("Idempotency-Key") String key,
                                      @RequestBody PaymentRequest req) {
        var existing = keys.findById(key);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get().getResponseJson());
        }
        String result = paymentService.charge(req);
        keys.save(new IdempotencyRecord(key, result));  // unique PK blocks races
        return ResponseEntity.status(201).body(result);
    }
}`,
      notes: [
        "If two requests race, the second insert fails on the primary key; catch `DataIntegrityViolationException` and return the stored result.",
        "For Kafka consumers, store processed message IDs the same way.",
      ],
    },
    interviewTip:
      "Whenever you mention retries, follow up with how the operation stays idempotent.",
  },
  {
    slug: "outbox-pattern",
    title: "Transactional Outbox",
    category: "async",
    summary:
      "Avoid the dual-write problem: save data and its event in one database transaction, then relay the event to Kafka. Spring Boot example.",
    body: [
      "Writing to your database and publishing to a message broker are two separate systems. If you save an order and then the app crashes before publishing OrderPlaced, other services never hear about it. Publish first and the save may fail instead. This is the dual-write problem.",
      "The outbox pattern fixes it by writing the event into an outbox table in the same database transaction as the business data. Either both are saved or neither is.",
      "A separate relay then reads the outbox and publishes to the broker, marking rows as sent. It can be a simple scheduled poller or change data capture with Debezium reading the database log.",
    ],
    flow: ["Service", "DB tx: orders + outbox", "Relay / Debezium", "Kafka"],
    useWhen: [
      "A state change must reliably produce an event",
      "You use events to keep other services in sync",
      "Building a saga across services",
    ],
    pros: [
      "No lost or phantom events",
      "Uses the database transaction you already have",
    ],
    cons: [
      "At-least-once delivery, so consumers must be idempotent",
      "Extra table and relay process to run",
    ],
    spring: {
      intro:
        "Save the outbox row inside the same `@Transactional` method, then publish with a scheduled relay.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-data-jpa",
        "org.springframework.kafka:spring-kafka",
      ],
      code: `@Transactional
public Order place(Cart cart) {
    Order order = orders.save(Order.from(cart));
    outbox.save(new OutboxEvent(
        "orders.placed", order.getId(), json.write(OrderPlaced.of(order))));
    return order;                      // both rows commit together
}

@Component
public class OutboxRelay {

    @Scheduled(fixedDelay = 500)
    @Transactional
    public void relay() {
        // SELECT ... FOR UPDATE SKIP LOCKED lets several instances share work
        for (OutboxEvent e : outbox.lockNextBatch(100)) {
            kafka.send(e.getTopic(), e.getAggregateId(), e.getPayload()).join();
            e.markSent();
        }
    }
}`,
      notes: [
        "Enable scheduling with `@EnableScheduling`.",
        "Debezium's outbox event router removes the poller entirely by streaming the table's changes.",
      ],
    },
    interviewTip:
      "Name the dual-write problem explicitly; the outbox is the standard answer.",
  },

  // ───────────────────────── Resilience ─────────────────────────
  {
    slug: "circuit-breaker",
    title: "Circuit Breaker",
    category: "resilience",
    summary:
      "Stop calling a failing service so failures do not cascade. Closed, open and half-open states with Resilience4j in Spring Boot.",
    body: [
      "When a service you depend on is failing, calling it again and again wastes threads, slows your users and makes its recovery harder. A circuit breaker notices the failures and stops calling for a while.",
      "It has three states. Closed: calls go through and failures are counted. Open: after too many failures, calls fail immediately without touching the remote service. Half-open: after a wait, a few trial calls are allowed; if they succeed it closes again.",
      "Pair it with a fallback, such as cached data, a default value or a friendly error, so the user still gets something useful.",
    ],
    flow: [
      "Caller",
      "Breaker: closed / open / half-open",
      "Remote service",
      "or fallback",
    ],
    useWhen: [
      "Calling any remote service or third-party API",
      "A slow dependency could exhaust your threads",
      "You can offer a sensible fallback",
    ],
    pros: [
      "Prevents cascading failures",
      "Gives the failing service room to recover",
    ],
    cons: [
      "Thresholds need tuning per dependency",
      "Fallbacks can hide real problems if not monitored",
    ],
    spring: {
      intro:
        "Resilience4j integrates with Spring Boot through annotations and YAML configuration, and publishes breaker state to Actuator.",
      dependencies: [
        "io.github.resilience4j:resilience4j-spring-boot3",
        "org.springframework.boot:spring-boot-starter-aop",
      ],
      code: `@Service
public class RecommendationClient {

    @CircuitBreaker(name = "recs", fallbackMethod = "popular")
    public List<Product> forUser(String userId) {
        return http.get().uri("/recs/{id}", userId)
                   .retrieve().body(new ParameterizedTypeReference<>() { });
    }

    // same signature + the exception
    private List<Product> popular(String userId, Throwable t) {
        return catalog.topSellers(10);
    }
}

# application.yml
resilience4j:
  circuitbreaker:
    instances:
      recs:
        sliding-window-size: 20
        failure-rate-threshold: 50          # % failures to open
        slow-call-duration-threshold: 2s
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3`,
      notes: [
        "Watch `/actuator/circuitbreakers` or the `resilience4j_circuitbreaker_state` metric.",
        "Count slow calls as failures; a dependency that hangs is worse than one that errors.",
      ],
    },
    interviewTip:
      "Describe all three states and what the user sees when the breaker is open.",
  },
  {
    slug: "retries-and-timeouts",
    title: "Retries and Timeouts",
    category: "resilience",
    summary:
      "Every remote call needs a timeout, and retries need backoff, jitter and limits. Configure both safely in Spring Boot with Resilience4j.",
    body: [
      "A call with no timeout can wait forever, holding a thread and a connection. Every remote call needs a connect timeout and a read timeout, set from the dependency's normal latency, not guessed.",
      "Retries fix brief glitches, but naive retries make outages worse: if every client retries instantly, the struggling service gets several times its normal load. Use exponential backoff (wait longer each time) with jitter (a random spread) and a small maximum number of attempts.",
      "Only retry operations that are safe to repeat, and only on errors that might succeed next time, such as timeouts and 503s, never on 400s.",
    ],
    flow: [
      "Call",
      "timeout",
      "wait 200ms ± jitter",
      "retry",
      "wait 400ms",
      "give up",
    ],
    useWhen: [
      "Calls over the network to services, databases or APIs",
      "Transient errors such as timeouts, 502, 503 and connection resets",
    ],
    pros: ["Hides brief blips from users", "Timeouts free up threads quickly"],
    cons: [
      "Retries multiply load during outages (retry storms)",
      "Unsafe for non-idempotent operations",
    ],
    spring: {
      intro:
        "Set timeouts on the HTTP client, and declare retries with Resilience4j's `@Retry`.",
      dependencies: ["io.github.resilience4j:resilience4j-spring-boot3"],
      code: `@Bean
RestClient paymentsClient(RestClient.Builder builder) {
    var settings = ClientHttpRequestFactorySettings.defaults()
        .withConnectTimeout(Duration.ofMillis(500))
        .withReadTimeout(Duration.ofSeconds(2));
    return builder
        .baseUrl("https://payments.internal")
        .requestFactory(ClientHttpRequestFactories.get(settings))
        .build();
}

@Retry(name = "payments")
@CircuitBreaker(name = "payments")
public PaymentStatus status(String paymentId) { ... }

# application.yml
resilience4j:
  retry:
    instances:
      payments:
        max-attempts: 3
        wait-duration: 200ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        enable-randomized-wait: true          # jitter
        retry-exceptions:
          - java.io.IOException
          - org.springframework.web.client.HttpServerErrorException`,
      notes: [
        "Retry should sit inside the circuit breaker so repeated failures still open it.",
        "Set an overall deadline so retries plus waits never exceed what the caller can wait.",
      ],
    },
    interviewTip:
      "Say “timeouts on every call, retries with backoff and jitter, only for idempotent operations”.",
  },
  {
    slug: "bulkhead",
    title: "Bulkhead Pattern",
    category: "resilience",
    summary:
      "Isolate resources so one slow dependency cannot use every thread. Semaphore and thread-pool bulkheads with Resilience4j in Spring Boot.",
    body: [
      "Ships are split into watertight compartments called bulkheads, so one leak does not sink the whole ship. The software version limits how much of your capacity any one dependency can use.",
      "Without it, if the recommendations service becomes slow, every request thread can end up stuck waiting on it, and checkout fails too even though it never calls recommendations.",
      "A semaphore bulkhead caps concurrent calls to a dependency; a thread-pool bulkhead gives it a separate, bounded pool. Calls beyond the limit are rejected fast instead of piling up.",
    ],
    flow: [
      "Incoming requests",
      "Pool A (payments) · Pool B (recs)",
      "Dependencies",
    ],
    useWhen: [
      "One service calls several dependencies with different reliability",
      "Critical paths must survive a non-critical dependency failing",
      "Multi-tenant systems where one tenant should not starve others",
    ],
    pros: [
      "Contains failures to one part of the system",
      "Keeps critical features available",
    ],
    cons: [
      "Capacity has to be divided and tuned",
      "Rejected calls need a fallback",
    ],
    spring: {
      intro:
        "Resilience4j's `@Bulkhead` limits concurrent calls per named dependency.",
      dependencies: ["io.github.resilience4j:resilience4j-spring-boot3"],
      code: `@Service
public class ProductPageService {

    @Bulkhead(name = "recs", fallbackMethod = "noRecs")
    public List<Product> recommendations(String userId) {
        return recsClient.forUser(userId);
    }

    private List<Product> noRecs(String userId, Throwable t) {
        return List.of();          // page still renders without recommendations
    }
}

# application.yml
resilience4j:
  bulkhead:
    instances:
      recs:
        max-concurrent-calls: 20      # at most 20 threads waiting on recs
        max-wait-duration: 0          # reject immediately when full`,
      notes: [
        "Combine with timeouts and a circuit breaker; together they form the standard resilience stack.",
        "With virtual threads, threads are cheap, but bulkheads still protect the downstream service.",
      ],
    },
    interviewTip:
      "Explain how a slow non-critical dependency could otherwise take down a critical path.",
  },

  // ───────────────────────── Architecture ─────────────────────────
  {
    slug: "microservices-vs-monolith",
    title: "Microservices vs Monolith",
    category: "architecture",
    summary:
      "When a modular monolith is the right call, when to split into microservices, and how Spring Modulith keeps a monolith's boundaries clean.",
    body: [
      "A monolith is one deployable application. A microservices system splits the same features into many small services, each with its own database, deployed independently.",
      "Microservices let large teams ship independently and scale parts separately, but they bring network failures, distributed data, more infrastructure and harder debugging. For most new products and small teams, a well-structured monolith is faster and cheaper.",
      "A good middle path is the modular monolith: one deployable, but split into modules with strict boundaries. If a module later needs to become a service, the seams are already there.",
    ],
    flow: [
      "Monolith",
      "Modular monolith",
      "Extract hot modules",
      "Microservices",
    ],
    useWhen: [
      "Monolith: a new product, a small team, unclear domain boundaries",
      "Microservices: many teams blocked on one deploy, parts with very different scaling needs",
    ],
    pros: [
      "Monolith: simple deploys, local calls, easy transactions",
      "Microservices: independent deploys, team autonomy, targeted scaling",
    ],
    cons: [
      "Monolith: can become tangled without discipline",
      "Microservices: distributed-systems complexity and operational cost",
    ],
    spring: {
      intro:
        "Spring Modulith treats top-level packages as modules and has a test that fails the build when one module reaches into another's internals.",
      dependencies: [
        "org.springframework.modulith:spring-modulith-starter-core",
        "org.springframework.modulith:spring-modulith-starter-test",
      ],
      code: `com.example.shop
├── ShopApplication.java
├── orders/                 // module: public API at the package root
│   ├── OrderService.java
│   └── internal/           // hidden from other modules
├── inventory/
└── payments/

class ModularityTests {
    @Test
    void verifiesModuleBoundaries() {
        ApplicationModules.of(ShopApplication.class).verify();
    }
}

// Modules talk through events instead of direct calls
@ApplicationModuleListener
void on(OrderPlaced event) {
    inventory.reserve(event.orderId());
}`,
      notes: [
        "Give each module its own tables even inside one database; it makes extraction later much easier.",
        "Split a service out when you have a concrete reason: team ownership, scaling or release cadence.",
      ],
    },
    interviewTip:
      "Show judgment: start modular, and name the specific pressure that would justify splitting.",
  },
  {
    slug: "service-discovery",
    title: "Service Discovery",
    category: "architecture",
    summary:
      "How services find each other when instances come and go: client-side registries like Eureka vs Kubernetes DNS, with Spring Cloud examples.",
    body: [
      "In a dynamic system, instances start, stop and move all the time, so hard-coded IP addresses break. Service discovery keeps a live list of where each service is running.",
      "With client-side discovery, each instance registers itself in a registry such as Netflix Eureka or Consul, and callers look up healthy instances and pick one. With server-side discovery, a platform such as Kubernetes gives each service a stable DNS name and balances behind it.",
      "If you run on Kubernetes, its built-in Services usually make a separate registry unnecessary.",
    ],
    flow: [
      "Instance registers",
      "Registry (Eureka)",
      "Caller looks up",
      "Calls instance",
    ],
    useWhen: [
      "Running many services outside Kubernetes, such as on VMs",
      "Instances scale up and down automatically",
    ],
    pros: [
      "No hard-coded addresses",
      "Unhealthy instances drop out automatically",
    ],
    cons: [
      "The registry is critical infrastructure that must be highly available",
      "Duplicates what Kubernetes already provides",
    ],
    spring: {
      intro:
        "Spring Cloud Netflix provides the Eureka server and client. Combined with `@LoadBalanced`, a call to `http://order-service` resolves automatically.",
      dependencies: [
        "spring-cloud-starter-netflix-eureka-server (registry app)",
        "spring-cloud-starter-netflix-eureka-client (every service)",
      ],
      code: `// Registry
@SpringBootApplication
@EnableEurekaServer
public class RegistryApplication { }

# order-service application.yml
spring:
  application:
    name: order-service          # the name others call
eureka:
  client:
    service-url:
      defaultZone: http://registry:8761/eureka

// Caller
@Bean @LoadBalanced
RestClient.Builder lbClient() { return RestClient.builder(); }

String body = lbClient.build()
    .get().uri("http://order-service/orders/42")
    .retrieve().body(String.class);`,
      notes: [
        "On Kubernetes, call `http://order-service` through the cluster DNS instead and skip Eureka.",
        "Spring Cloud Kubernetes can read Services and ConfigMaps if you need discovery APIs there.",
      ],
    },
    interviewTip:
      "Mention that on Kubernetes, DNS-based discovery is usually enough.",
  },
  {
    slug: "saga-pattern",
    title: "Saga Pattern",
    category: "architecture",
    summary:
      "Run a business transaction across microservices without two-phase commit: local steps plus compensating actions, orchestrated in Spring Boot.",
    body: [
      "When an order touches inventory, payments and shipping, each owned by a different service with its own database, you cannot wrap it in one database transaction. Two-phase commit exists but is slow and fragile across services.",
      "A saga breaks the work into local transactions, one per service. If a later step fails, earlier steps are undone with compensating actions: release the reserved stock, refund the payment.",
      "Sagas are either choreographed (each service reacts to the previous service's event) or orchestrated (one coordinator tells each service what to do next). Orchestration is easier to follow once there are more than three steps.",
    ],
    flow: [
      "Reserve stock",
      "Charge card",
      "Book shipping",
      "on failure: refund → release",
    ],
    useWhen: [
      "A business process spans several services and databases",
      "Each step can be reversed or compensated",
    ],
    pros: [
      "No distributed locks; each service stays autonomous",
      "Scales and tolerates partial failure",
    ],
    cons: [
      "Only eventually consistent; intermediate states are visible",
      "Compensations must be designed for every step",
    ],
    spring: {
      intro:
        "A minimal orchestrator: run steps in order and, on failure, run the compensations for the steps that already succeeded, in reverse. Frameworks such as Axon or Temporal handle persistence and retries for you.",
      dependencies: ["spring-kafka or HTTP clients to call each service"],
      code: `public record SagaStep(String name, Runnable action, Runnable compensation) { }

@Service
public class CheckoutSaga {

    public void run(Order order) {
        List<SagaStep> steps = List.of(
            new SagaStep("reserve", () -> inventory.reserve(order),
                                    () -> inventory.release(order)),
            new SagaStep("charge",  () -> payments.charge(order),
                                    () -> payments.refund(order)),
            new SagaStep("ship",    () -> shipping.book(order),
                                    () -> shipping.cancel(order)));

        Deque<SagaStep> done = new ArrayDeque<>();
        try {
            for (SagaStep step : steps) {
                step.action().run();
                done.push(step);
                sagaLog.record(order.getId(), step.name());   // persist progress
            }
        } catch (RuntimeException e) {
            while (!done.isEmpty()) done.pop().compensation().run();
            throw new CheckoutFailed(order.getId(), e);
        }
    }
}`,
      notes: [
        "Persist saga state so a crash mid-way can resume or compensate on restart.",
        "Every action and compensation must be idempotent, because they may be retried.",
      ],
    },
    interviewTip:
      "Explain compensations and choose choreography or orchestration with a reason.",
  },
  {
    slug: "observability",
    title: "Observability",
    category: "architecture",
    summary:
      "Logs, metrics and distributed traces: how to see inside a running system, with Spring Boot Actuator, Micrometer and OpenTelemetry tracing.",
    body: [
      "Observability is how well you can understand what a system is doing from the outside. It rests on three signals: logs (what happened), metrics (how much and how fast) and traces (where a single request went across services).",
      "Metrics drive dashboards and alerts. The RED method is a good starting set for every service: Rate, Errors and Duration of requests.",
      "Distributed tracing gives each request a trace ID that travels through every service call and message. When a checkout is slow, the trace shows exactly which hop took the time. Put the same trace ID in your logs so you can jump between them.",
    ],
    flow: [
      "Service A",
      "Service B",
      "Service C",
      "Traces · Metrics · Logs → dashboards",
    ],
    useWhen: [
      "From day one, in every service that runs in production",
      "Debugging latency or errors that cross service boundaries",
      "Defining SLOs and alerts",
    ],
    pros: [
      "Find the cause of incidents in minutes, not hours",
      "Data to back capacity and performance decisions",
    ],
    cons: [
      "Storage and tooling cost, especially for logs",
      "High-cardinality labels can overload metrics systems",
    ],
    spring: {
      intro:
        "Actuator exposes health and metrics, Micrometer records them, and Micrometer Tracing with the OpenTelemetry bridge propagates trace IDs automatically across HTTP and Kafka calls.",
      dependencies: [
        "org.springframework.boot:spring-boot-starter-actuator",
        "io.micrometer:micrometer-registry-prometheus",
        "io.micrometer:micrometer-tracing-bridge-otel",
        "io.opentelemetry:opentelemetry-exporter-otlp",
      ],
      code: `# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      probes:
        enabled: true              # /actuator/health/liveness and /readiness
  tracing:
    sampling:
      probability: 0.1             # trace 10% of requests
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces

logging:
  pattern:
    level: "%5p [%X{traceId:-},%X{spanId:-}]"   # trace ID in every log line

// Custom business metric
@Observed(name = "checkout.place")
public Order place(Cart cart) { ... }`,
      notes: [
        "`@Observed` needs the `ObservedAspect` bean and `spring-boot-starter-aop`.",
        "Never use user IDs or URLs with IDs as metric tags; they explode cardinality.",
      ],
    },
    interviewTip: "Mention all three signals and that trace IDs connect them.",
  },
];

export const SYSTEM_DESIGN_PATH = "/system-design";

export function conceptPath(slug: string): string {
  return `${SYSTEM_DESIGN_PATH}/${slug}`;
}

export function getConcept(slug: string): Concept | undefined {
  return CONCEPTS.find((c) => c.slug === slug);
}

export function conceptsInCategory(id: CategoryId): Concept[] {
  return CONCEPTS.filter((c) => c.category === id);
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Previous and next concept in reading order, for page-to-page navigation. */
export function neighbours(slug: string): {
  prev?: Concept;
  next?: Concept;
} {
  const i = CONCEPTS.findIndex((c) => c.slug === slug);
  return { prev: CONCEPTS[i - 1], next: CONCEPTS[i + 1] };
}
