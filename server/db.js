const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function initDb() {
    const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        DROP TABLE IF EXISTS matches;
        DROP TABLE IF EXISTS needs;
        DROP TABLE IF EXISTS volunteers;

        CREATE TABLE needs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            location TEXT,
            lat REAL,
            lng REAL,
            urgency TEXT, 
            category TEXT, 
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE volunteers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            skills TEXT,
            location TEXT,
            lat REAL,
            lng REAL,
            availability TEXT,
            contact TEXT
        );

        CREATE TABLE matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            need_id INTEGER,
            volunteer_id INTEGER,
            ai_reasoning TEXT,
            match_score INTEGER,
            match_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(need_id) REFERENCES needs(id),
            FOREIGN KEY(volunteer_id) REFERENCES volunteers(id)
        );
    `);

    // Diverse, realistic demo data with coordinates (roughly around a generic city center 28.6139, 77.2090)
    await db.run(`INSERT INTO needs (title, description, location, lat, lng, urgency, category) VALUES 
        ('Post-Flood Medical Support', 'Mobile clinic needs 2 medical assistants for basic triage in flooded rural zones.', 'Riverside Village', 28.6250, 77.2100, 'Critical', 'Health'),
        ('Emergency Rations Distribution', 'Help needed to organize and distribute food kits to 200 displaced families.', 'Central Warehouse', 28.6139, 77.2090, 'High', 'Food'),
        ('Solar Irrigation Repair', 'Technician needed to repair community-owned solar pumps for local farmers.', 'Green Valley Farms', 28.6000, 77.2200, 'Medium', 'Agriculture'),
        ('Youth Literacy Workshop', 'Volunteer tutors needed for weekend reading sessions at the community center.', 'Sector 7 Library', 28.6300, 77.1900, 'Low', 'Education'),
        ('Safe Water Tank Installation', 'Plumbing assistance needed to install 3 large water filtration tanks.', 'Hillside Settlement', 28.6400, 77.2300, 'High', 'Water'),
        ('Sanitation Awareness Drive', 'Community outreach volunteers needed to teach basic hygiene practices.', 'Market Square', 28.6100, 77.1800, 'Medium', 'Health'),
        ('Elderly Care Support', 'Weekly check-ins and grocery delivery for isolated elderly residents.', 'Old Town District', 28.6500, 77.2000, 'Medium', 'Social Support'),
        ('Bridge Repair Triage', 'Engineering assessment for a small pedestrian bridge damaged by storms.', 'Creek Path', 28.5900, 77.2400, 'Critical', 'Infrastructure')
    `);

    await db.run(`INSERT INTO volunteers (name, skills, location, lat, lng, availability) VALUES 
        ('Dr. Sarah Chen', 'Medical, Triage, First Aid', 'Central District', 28.6150, 77.2050, 'Weekends'),
        ('Marcus Rodriguez', 'Engineering, Construction, Logistics', 'Old Town', 28.6450, 77.2050, 'Full-time'),
        ('Priya Sharma', 'Education, Mentoring, Languages', 'Sector 7', 28.6280, 77.1950, 'Evenings'),
        ('David Miller', 'Plumbing, Water Systems, Repair', 'Hillside', 28.6350, 77.2250, 'Part-time'),
        ('Elena Gomez', 'Social Work, Counseling, Elderly Care', 'Riverside', 28.6200, 77.2150, 'Weekends'),
        ('Sam Wilson', 'Logistics, Driving, Heavy Lifting', 'Market Square', 28.6050, 77.1850, 'On-call')
    `);

    return db;
}

module.exports = { initDb };
