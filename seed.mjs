import { createClient } from "@supabase/supabase-js";

// Run with: SUPABASE_SERVICE_KEY=<key> node seed.mjs
const supabase = createClient(
  process.env.SUPABASE_URL || "https://nsytfuyxqicrrxinxtkw.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

const users = [
  { email: "sarah.chen@demo.com", display_name: "Sarah Chen", username: "sarahfoodie", bio: "NYC food blogger 🍕 Always hunting for the best slice", photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", home_city: "New York" },
  { email: "marcus.williams@demo.com", display_name: "Marcus Williams", username: "marcuseats", bio: "Chef turned food explorer. Toronto born 🇨🇦", photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", home_city: "Toronto" },
  { email: "sofia.martinez@demo.com", display_name: "Sofia Martinez", username: "sofiasbites", bio: "Living to eat, not eating to live ✨ Montreal", photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", home_city: "Montreal" },
  { email: "james.park@demo.com", display_name: "James Park", username: "jamespark_eats", bio: "Korean-Canadian food nerd 🍜 Ramen is a personality trait", photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", home_city: "Vancouver" },
  { email: "emma.thompson@demo.com", display_name: "Emma Thompson", username: "emmaeats", bio: "Brunch queen 👑 | Coffee snob ☕ | Chicago", photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face", home_city: "Chicago" },
  { email: "alex.rivera@demo.com", display_name: "Alex Rivera", username: "alexrivera", bio: "Taco enthusiast 🌮 LA food scene", photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", home_city: "Los Angeles" },
];

const posts = [
  // Sarah - NYC
  { username: "sarahfoodie", place_id: "ChIJsf0galRYwokRuPfBbfrBIBY", place_name: "Joe's Pizza", place_address: "7 Carmine St, New York, NY", lat: 40.7303, lng: -74.0023, city: "New York", caption: "The OG NYC slice. Thin crust perfection since 1975. If you haven't been here, have you even been to New York?", rating: 5, tags: ["pizza", "nyc", "must-try", "classic"], photos: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800"] },
  { username: "sarahfoodie", place_id: "ChIJEYkTo9VYwokRJjUmQW_SBAY", place_name: "Peter Luger Steak House", place_address: "178 Broadway, Brooklyn, NY", lat: 40.7099, lng: -73.9625, city: "Brooklyn", caption: "Best steak in New York, hands down. The porterhouse for two is legendary 🥩", rating: 5, tags: ["steak", "fine-dining", "nyc", "date-night"], photos: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800", "https://images.unsplash.com/photo-1558030006-450675393462?w=800"] },
  { username: "sarahfoodie", place_id: "ChIJK1rsz_9YwokRHQSQPOrEAAQ", place_name: "Los Tacos No. 1", place_address: "75 9th Ave, New York, NY", lat: 40.7425, lng: -74.0049, city: "New York", caption: "These adobada tacos haunt my dreams. Chelsea Market gem 🌮", rating: 4, tags: ["tacos", "mexican", "nyc", "budget"], photos: ["https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800"] },
  // Marcus - Toronto
  { username: "marcuseats", place_id: "ChIJ5eBaMjc1K4gRPYhZqF07TWQ", place_name: "Pai Northern Thai Kitchen", place_address: "18 Duncan St, Toronto, ON", lat: 43.6486, lng: -79.3871, city: "Toronto", caption: "The pad thai here is unreal. Always a line but SO worth the wait 🔥", rating: 5, tags: ["thai", "toronto", "must-try", "noodles"], photos: ["https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800", "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=800"] },
  { username: "marcuseats", place_id: "ChIJG3wJBIA0K4gRk_3MxUKOXX8", place_name: "Richmond Station", place_address: "1 Richmond St W, Toronto, ON", lat: 43.6516, lng: -79.3790, city: "Toronto", caption: "Farm-to-table done right. The burger is insane. One of Toronto's best kept secrets.", rating: 4, tags: ["burgers", "farm-to-table", "toronto", "brunch"], photos: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800"] },
  { username: "marcuseats", place_id: "ChIJu5shlDM1K4gRqdmDvxbpzW4", place_name: "Ramen Isshin", place_address: "421 College St, Toronto, ON", lat: 43.6563, lng: -79.4102, city: "Toronto", caption: "Rich tonkotsu broth that warms the soul. Perfect after a cold Toronto day ❄️🍜", rating: 5, tags: ["ramen", "japanese", "toronto", "noodles"], photos: ["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800", "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800"] },
  // Sofia - Montreal
  { username: "sofiasbites", place_id: "ChIJJSXCKJoayUwR3bV9M-3FDr8", place_name: "Schwartz's Deli", place_address: "3895 St Laurent Blvd, Montreal, QC", lat: 45.5168, lng: -73.5774, city: "Montreal", caption: "Smoked meat sandwich that changed my life. 100 years of perfection 🥪", rating: 5, tags: ["deli", "montreal", "classic", "must-try"], photos: ["https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800", "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800"] },
  { username: "sofiasbites", place_id: "ChIJK_pgq5oayUwR8MIbCVQ1jWY", place_name: "Joe Beef", place_address: "2491 Rue Notre-Dame O, Montreal, QC", lat: 45.4839, lng: -73.5806, city: "Montreal", caption: "Best restaurant in Canada? Maybe. The lobster spaghetti is out of this world 🦞", rating: 5, tags: ["fine-dining", "montreal", "date-night", "seafood"], photos: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800", "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800"] },
  { username: "sofiasbites", place_id: "ChIJQ8HOXp0ayUwRx0E73KiKhAM", place_name: "La Banquise", place_address: "994 Rue Rachel E, Montreal, QC", lat: 45.5264, lng: -73.5706, city: "Montreal", caption: "30+ types of poutine. Open 24/7. This is peak Montreal culture 🍟🧀", rating: 4, tags: ["poutine", "montreal", "late-night", "budget"], photos: ["https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800", "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800"] },
  // James - Vancouver  
  { username: "jamespark_eats", place_id: "ChIJ2drmkxdxhlQRPVlMOX-H2q8", place_name: "Miku Restaurant", place_address: "200 Granville St, Vancouver, BC", lat: 49.2871, lng: -123.1116, city: "Vancouver", caption: "Aburi sushi that melts in your mouth. Waterfront views + world-class sushi = perfection 🍣", rating: 5, tags: ["sushi", "japanese", "vancouver", "fine-dining"], photos: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800", "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800"] },
  { username: "jamespark_eats", place_id: "ChIJ36-sCRlxhlQRZiHVZ0V2xLA", place_name: "Marutama Ramen", place_address: "780 Bidwell St, Vancouver, BC", lat: 49.2886, lng: -123.1353, city: "Vancouver", caption: "Chicken broth ramen that rivals anything in Tokyo. The tamago is 💯", rating: 4, tags: ["ramen", "japanese", "vancouver", "noodles"], photos: ["https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800", "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800"] },
  // Emma - Chicago
  { username: "emmaeats", place_id: "ChIJ7cv00DwsDogROpNOkkJmf0Q", place_name: "Lou Malnati's Pizzeria", place_address: "439 N Wells St, Chicago, IL", lat: 41.8906, lng: -87.6340, city: "Chicago", caption: "Deep dish perfection. Buttercrust is everything. Sorry NYC, Chicago wins the pizza war 🍕", rating: 5, tags: ["pizza", "chicago", "deep-dish", "classic"], photos: ["https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800", "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800"] },
  { username: "emmaeats", place_id: "ChIJfzufMH0rDogRbTyUXoGm38g", place_name: "Au Cheval", place_address: "800 W Randolph St, Chicago, IL", lat: 41.8841, lng: -87.6472, city: "Chicago", caption: "This burger needs no introduction. 45 min wait, worth every second 🍔", rating: 5, tags: ["burgers", "chicago", "must-try", "date-night"], photos: ["https://images.unsplash.com/photo-1586816001966-79b736744398?w=800", "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800"] },
  { username: "emmaeats", place_id: "ChIJrTGwz3ErDogROmB1jJP30Rw", place_name: "The Publican", place_address: "837 W Fulton Market, Chicago, IL", lat: 41.8867, lng: -87.6484, city: "Chicago", caption: "Best brunch in the city. The pork belly is insane and the beer list goes forever 🍺", rating: 4, tags: ["brunch", "chicago", "beer", "farm-to-table"], photos: ["https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800", "https://images.unsplash.com/photo-1533920379810-6bedac961555?w=800"] },
  // Alex - LA
  { username: "alexrivera", place_id: "ChIJOaegwbTAwoARz8rMoMVoAh4", place_name: "Guerrilla Tacos", place_address: "2000 E 7th St, Los Angeles, CA", lat: 34.0324, lng: -118.2271, city: "Los Angeles", caption: "Sweet potato taco with feta and almond. Changed what I thought tacos could be 🌮✨", rating: 5, tags: ["tacos", "mexican", "la", "must-try"], photos: ["https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800", "https://images.unsplash.com/photo-1624300629298-e9209cf98f25?w=800"] },
  { username: "alexrivera", place_id: "ChIJA4xyErPHwoAR2Q3c0eLWfaY", place_name: "Howlin' Ray's", place_address: "727 N Broadway, Los Angeles, CA", lat: 34.0611, lng: -118.2396, city: "Los Angeles", caption: "Nashville hot chicken that will DESTROY you in the best way. Howlin+ heat level is no joke 🔥🍗", rating: 5, tags: ["chicken", "la", "spicy", "must-try"], photos: ["https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800", "https://images.unsplash.com/photo-1562967914-608f82629710?w=800"] },
  { username: "alexrivera", place_id: "ChIJ3z7MHn25woARkx0bQFYD5RM", place_name: "Bestia", place_address: "2121 E 7th Pl, Los Angeles, CA", lat: 34.0327, lng: -118.2274, city: "Los Angeles", caption: "Italian done LA-style. The bone marrow pasta is unforgettable. Book weeks ahead!", rating: 5, tags: ["italian", "la", "fine-dining", "pasta", "date-night"], photos: ["https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800", "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=800"] },
];

async function seed() {
  console.log("Creating demo users...");
  
  const userIds = {};
  
  for (const u of users) {
    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "DemoPass123!",
      email_confirm: true,
      user_metadata: { full_name: u.display_name, avatar_url: u.photo_url },
    });
    
    if (authErr) { console.error(`Failed to create ${u.email}:`, authErr.message); continue; }
    const uid = authData.user.id;
    userIds[u.username] = uid;
    console.log(`  Created auth user: ${u.email} -> ${uid}`);
    
    // Update profile
    const { error: profErr } = await supabase
      .from("users")
      .update({ username: u.username, display_name: u.display_name, bio: u.bio, photo_url: u.photo_url, home_city: u.home_city, onboarded: true })
      .eq("id", uid);
    
    if (profErr) console.error(`  Failed to update profile for ${u.username}:`, profErr.message);
    else console.log(`  Updated profile: @${u.username}`);
  }
  
  console.log("\nCreating posts...");
  
  for (const p of posts) {
    const uid = userIds[p.username];
    if (!uid) { console.error(`  No user ID for ${p.username}, skipping`); continue; }
    
    // Randomize visited_at within last 60 days
    const daysAgo = Math.floor(Math.random() * 60);
    const visitedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    
    const { error } = await supabase.from("posts").insert({
      user_id: uid,
      place_id: p.place_id,
      place_name: p.place_name,
      place_address: p.place_address,
      lat: p.lat,
      lng: p.lng,
      city: p.city,
      caption: p.caption,
      rating: p.rating,
      tags: p.tags,
      visited_at: visitedAt,
      photo_urls: p.photos,
      visibility: "public",
    });
    
    if (error) console.error(`  Failed post ${p.place_name}:`, error.message);
    else console.log(`  Created: ${p.place_name} by @${p.username}`);
  }
  
  // Create some follow relationships
  console.log("\nCreating follows...");
  const usernames = Object.keys(userIds);
  for (let i = 0; i < usernames.length; i++) {
    // Each user follows 2-3 random others
    const followCount = 2 + Math.floor(Math.random() * 2);
    const others = usernames.filter((_, j) => j !== i);
    for (let f = 0; f < Math.min(followCount, others.length); f++) {
      const target = others[Math.floor(Math.random() * others.length)];
      others.splice(others.indexOf(target), 1);
      try {
        await supabase.from("follows").insert({ follower_id: userIds[usernames[i]], following_id: userIds[target] });
        // Update counts
        await supabase.from("users").update({ following_count: supabase.rpc ? undefined : 0 }).eq("id", userIds[usernames[i]]);
      } catch {}
    }
  }
  
  // Fix follower/following counts
  console.log("\nUpdating counts...");
  for (const [username, uid] of Object.entries(userIds)) {
    const { count: followerCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", uid);
    const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", uid);
    const { count: postCount } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", uid);
    
    await supabase.from("users").update({ 
      follower_count: followerCount || 0, 
      following_count: followingCount || 0,
      post_count: postCount || 0,
    }).eq("id", uid);
    console.log(`  @${username}: ${postCount} posts, ${followerCount} followers, ${followingCount} following`);
  }
  
  // Also make Naimur follow some of them and vice versa
  const naimurId = "b3834671-1834-44a7-88e4-32656a976179";
  for (const username of ["sarahfoodie", "marcuseats", "sofiasbites"]) {
    const uid = userIds[username];
    if (!uid) continue;
    await supabase.from("follows").insert({ follower_id: naimurId, following_id: uid }).catch(() => {});
    await supabase.from("follows").insert({ follower_id: uid, following_id: naimurId }).catch(() => {});
  }
  
  // Update Naimur's counts
  const { count: nFollowers } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", naimurId);
  const { count: nFollowing } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", naimurId);
  await supabase.from("users").update({ follower_count: nFollowers || 0, following_count: nFollowing || 0 }).eq("id", naimurId);
  console.log(`  @rumianr: ${nFollowers} followers, ${nFollowing} following`);
  
  console.log("\n✅ Seeding complete!");
}

seed().catch(console.error);
