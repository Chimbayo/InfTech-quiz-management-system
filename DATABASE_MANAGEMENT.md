# Database Management for Deployed Systems

## 🚀 **Quick Setup Guide**

### **For Your Current SQLite Deployment:**

1. **Access Database Management Interface**
   ```
   https://your-domain.com/admin/database
   ```
   - Requires admin login
   - Secure web-based interface
   - Real-time database statistics

2. **Environment Configuration**
   Copy `.env.example` to `.env.local` and configure:
   ```env
   # Enable database management
   ADMIN_DATABASE_ACCESS=true
   REQUIRE_ADMIN_AUTH=true
   DATABASE_EXPORT_ENABLED=true
   
   # Prisma Studio settings
   PRISMA_STUDIO_PORT=5555
   PRISMA_STUDIO_HOST=localhost
   ```

3. **Deploy with Database Management**
   ```bash
   # Build and deploy
   npm run build
   npm start
   
   # Access admin panel
   # Navigate to /admin/database
   ```

## 🛠️ **Available Features**

### **Web-Based Database Admin**
- ✅ **Prisma Studio Integration**: Launch studio directly from admin panel
- ✅ **Database Statistics**: Real-time stats and metrics
- ✅ **Export Database**: Download SQLite file for backup
- ✅ **Secure Access**: Admin authentication required
- ✅ **Production Ready**: Environment-based configuration

### **Database Operations**
- **View Data**: Browse all tables and relationships
- **Edit Records**: Modify data with visual interface
- **Run Queries**: Execute custom database queries
- **Export Data**: Download database backups
- **Monitor Usage**: Track database size and activity

## 🔐 **Security Features**

### **Authentication Layers**
1. **Admin Role Required**: Only admin users can access
2. **Environment Controls**: Can be disabled via environment variables
3. **Access Key Protection**: Optional additional security layer
4. **Audit Logging**: Track database access attempts

### **Production Security**
```env
# Secure configuration for production
REQUIRE_ADMIN_AUTH=true
DB_ADMIN_ACCESS_KEY=your-secure-key-here
DATABASE_EXPORT_ENABLED=true
ENABLE_DB_LOGGING=true
```

## 📊 **Database Statistics Dashboard**

The admin interface provides:
- **User Count**: Total registered users
- **Quiz Count**: Number of quizzes created
- **Submission Count**: Quiz attempts made
- **Chat Activity**: Messages and rooms
- **Database Size**: File size and growth
- **Recent Activity**: Latest users and quizzes

## 🚀 **Upgrading to PostgreSQL (Recommended)**

For better production database management:

1. **Choose a Provider**:
   - **Supabase** (Free tier, built-in admin)
   - **Railway** (PostgreSQL with web interface)
   - **PlanetScale** (MySQL with admin panel)
   - **Neon** (Serverless PostgreSQL)

2. **Update Configuration**:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

3. **Migrate Schema**:
   ```bash
   npx prisma migrate deploy
   ```

## 🔧 **Alternative Access Methods**

### **SSH + Prisma Studio**
If you have server access:
```bash
ssh user@your-server.com
cd /path/to/your/app
npm run db:studio
# Access via http://your-server-ip:5555
```

### **Direct Database Tools**
- **SQLite Browser**: Download and open locally
- **Adminer**: Lightweight web-based admin
- **DBeaver**: Desktop database client

## 📱 **Mobile-Friendly Interface**

The database management interface is responsive and works on:
- ✅ Desktop browsers
- ✅ Tablet devices  
- ✅ Mobile phones
- ✅ Touch-friendly controls

## 🆘 **Troubleshooting**

### **Common Issues**

1. **"Database access is disabled"**
   - Set `ADMIN_DATABASE_ACCESS=true` in environment

2. **"Authentication required"**
   - Ensure you're logged in as admin
   - Check `REQUIRE_ADMIN_AUTH` setting

3. **"Prisma Studio won't start"**
   - Check port availability (default 5555)
   - Verify database file exists
   - Check server permissions

4. **"Export not working"**
   - Set `DATABASE_EXPORT_ENABLED=true`
   - Check file permissions
   - Verify database file path

### **Support**
- Check server logs for detailed error messages
- Verify environment configuration
- Test with local development setup first

## 🎯 **Best Practices**

1. **Regular Backups**: Export database regularly
2. **Monitor Size**: Track database growth
3. **Secure Access**: Use strong admin passwords
4. **Environment Separation**: Different configs for dev/prod
5. **Audit Access**: Monitor who accesses database management

---

**Your database management system is now ready for production use!** 🎉

Access it at: `https://your-domain.com/admin/database`
