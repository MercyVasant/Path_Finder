const mongoose = require('mongoose');
const dotenv = require('dotenv');
const xlsx = require('xlsx');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Read Excel
        const workbook = xlsx.readFile('../LDCE_Faculty_Final.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet); 

        // Fetch all departments
        const departments = await Department.find();
        const deptMap = {};
        for (const d of departments) {
            deptMap[d.name.toLowerCase()] = d;
        }

        console.log(`Found ${departments.length} departments in DB.`);

        // Clear existing faculties
        await Faculty.deleteMany({});
        console.log("Cleared existing faculties.");

        const facultyDocs = [];
        let missingDepts = new Set();
        let skippedCount = 0;

        for (const row of data) {
            const deptName = row['Department'] ? row['Department'].toString().trim() : '';
            if (!deptName) {
                skippedCount++;
                continue;
            }

            // Try to match department
            let matchedDept = deptMap[deptName.toLowerCase()];
            if (!matchedDept) {
                // Try fuzzy match
                matchedDept = departments.find(d => d.name.toLowerCase().includes(deptName.toLowerCase()) || deptName.toLowerCase().includes(d.name.toLowerCase()));
            }

            // If still not matched, maybe it's something like "Computer" vs "Computer Department"
            if (!matchedDept) {
                // Let's create it on the fly if it's missing, but attach it to a default building or just leave building empty
                missingDepts.add(deptName);
                
                // Let's create the missing department so we don't lose data
                console.log(`Creating missing department: ${deptName}`);
                matchedDept = new Department({
                    name: deptName,
                    hod: "To Be Announced",
                    // leaving building empty as we don't know it
                });
                await matchedDept.save();
                departments.push(matchedDept);
                deptMap[deptName.toLowerCase()] = matchedDept;
            }

            const facultyEmail = row['Email'] ? row['Email'].toString().trim() : null;

            facultyDocs.push({
                name: row['Name'] || 'Unknown',
                title: row['Position'] || '',
                department: matchedDept._id,
                office: {
                    building: matchedDept.building || null,
                    roomNumber: "TBA"
                },
                email: facultyEmail === 'None' || facultyEmail === 'none' || facultyEmail === '-' ? null : facultyEmail,
                details: "Faculty member at LD College of Engineering."
            });
        }

        if (facultyDocs.length > 0) {
            // handle duplicate emails by filtering out nulls properly, but we might have duplicates in the excel itself
            // To be safe against duplicate emails throwing errors, we can insert them one by one or use ordered: false
            const operations = facultyDocs.map(doc => ({
                insertOne: { document: doc }
            }));
            const result = await Faculty.bulkWrite(operations, { ordered: false }).catch(err => {
                console.error("Some duplicates might have been skipped:", err.writeErrors ? err.writeErrors.length : err);
            });
            console.log(`Successfully processed faculties.`);
        } else {
            console.log("No faculties to insert.");
        }

        if (missingDepts.size > 0) {
            console.log("Created the following new departments that were not in DB:");
            console.log(Array.from(missingDepts));
        }

        console.log(`Skipped ${skippedCount} rows due to empty department.`);

    } catch (err) {
        console.error("Error importing data:", err);
    } finally {
        mongoose.disconnect();
    }
};

importData();
