/* ==========================================
   Cozy Level Configurations & Tasks Data
   ========================================== */

import { PALETTE } from './assets.js';
import { Particles } from './particles.js';
import { Audio } from './audio.js';

// Level map size: 32x24 tiles
export const TILE_SIZE = 32;
export const MAP_COLS = 32;
export const MAP_ROWS = 24;

export const LEVEL_DATA = [
  // LEVEL 1: BLOSSOM MEADOW
  {
    id: 1,
    name: "Blossom Meadow",
    theme: "First Impressions & New Beginnings",
    tileType: "grass",
    skyColor: "#e8f5e9",
    particles: "sakura",
    taskTemplate: [
      { id: "pick_flowers", label: "Pick Flowers", current: 0, target: 20 },
      { id: "lost_chicks", label: "Help Lost Chicks", current: 0, target: 3 },
      { id: "pet_cats", label: "Pet Every Cat", current: 0, target: 3 },
      { id: "feed_mochi", label: "Feed Mochi (Carrot)", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      // Grass with path down middle
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r >= 10 && r <= 13) ? 'd' : 'g'; // d is path, g is grass
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];
      
      // 20 flowers to pick
      for (let i = 0; i < 20; i++) {
        const type = i % 2 === 0 ? 'flower_red' : 'flower_blue';
        entities.push({
          type: 'flower',
          sprite: type,
          x: 60 + Math.random() * 900,
          y: 60 + Math.random() * 640,
          size: 16,
          picked: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.picked) return;
            self.picked = true;
            self.interactive = false;
            level.updateTask("pick_flowers", 1);
            return [{ speaker: "Mochi", text: "Got a pretty flower! 🌸" }];
          }
        });
      }

      // Mother Chick & Lost Chicks
      const motherChickX = 480;
      const motherChickY = 220;
      entities.push({
        type: 'npc',
        sprite: 'mama_duck', // using duck as placeholder mother chick
        x: motherChickX,
        y: motherChickY,
        size: 32,
        interactive: true,
        dialogues: [
          { speaker: "Mother Hen", text: "Oh dear, my three little chicks wandered off in the tall grass!", expression: "sad" },
          { speaker: "Mother Hen", text: "Please bring them back to me if you find them." }
        ]
      });

      const chickCoords = [
        { x: 120, y: 150 },
        { x: 860, y: 180 },
        { x: 740, y: 640 }
      ];
      chickCoords.forEach((coord, idx) => {
        entities.push({
          id: `chick_${idx}`,
          type: 'chick',
          sprite: 'chick',
          x: coord.x,
          y: coord.y,
          size: 16,
          saved: false,
          interactive: true,
          following: false,
          onInteract: (player, self) => {
            if (self.saved) return;
            if (!self.following) {
              self.following = true;
              return [
                { speaker: "Chick", text: "Cheep! (It started following you!)", expression: "happy" }
              ];
            } else {
              // Check distance to Mother
              const dist = Math.hypot(self.x - motherChickX, self.y - motherChickY);
              if (dist < 80) {
                self.following = false;
                self.saved = true;
                self.interactive = false;
                self.x = motherChickX + 24 + idx * 16;
                self.y = motherChickY + 16;
                level.updateTask("lost_chicks", 1);
                return [
                  { speaker: "Mother Hen", text: "Thank you for bringing my little one home! ❤️", expression: "happy" }
                ];
              } else {
                return [{ speaker: "Mochi", text: "Let's guide this chick back to its mama!" }];
              }
            }
          }
        });
      });

      // 3 Cats to pet
      const catCoords = [
        { x: 260, y: 180 },
        { x: 580, y: 680 },
        { x: 820, y: 480 }
      ];
      catCoords.forEach((coord, idx) => {
        entities.push({
          type: 'cat',
          sprite: 'cat_sleep',
          x: coord.x,
          y: coord.y,
          size: 24,
          pet: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.pet) {
              return [{ speaker: "Cat", text: "Purrrrrr... ❤️", expression: "happy" }];
            }
            self.pet = true;
            self.sprite = 'cat_happy';
            level.updateTask("pet_cats", 1);
            return [
              { speaker: "Cat", text: "Meow! *rolls over happily*", expression: "happy" },
              { speaker: "Mochi", text: "Looks like you've made a new friend!" }
            ];
          }
        });
      });

      // Mochi's carrot bowl
      entities.push({
        type: 'carrot_bowl',
        sprite: 'teacup', // simple placeholder bowl
        x: 100,
        y: 350,
        size: 20,
        fed: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.fed) return [{ speaker: "Mochi", text: "My tummy is full of carrots!" }];
          self.fed = true;
          self.interactive = false;
          level.updateTask("feed_mochi", 1);
          return [
            { speaker: "Mochi", text: "Nom nom nom... Best carrot ever!", expression: "happy" },
            { speaker: "Mochi", text: "...Don't tell the others." }
          ];
        }
      });

      // Hidden Memory Flower
      entities.push({
        type: 'hidden_memory',
        sprite: 'glowing_flower',
        x: 940,
        y: 100,
        size: 16,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          // Trigger memory text box overlay
          return [
            { speaker: "Mochi", text: "This flower waited for someone...", expression: "happy" },
            { speaker: "Mochi", text: "Someone who always notices the little things." },
            { speaker: "Letter", text: "\"Just a little flower for the prettiest girl. 🌸\"" }
          ];
        }
      });

      // Benches
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 480,
        y: 400,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A cozy wooden bench. Perfect for watching the wind blow." }]
      });

      return entities;
    }
  },

  // LEVEL 2: RIVER OF WISHES
  {
    id: 2,
    name: "River of Wishes",
    theme: "Dreams & Promises",
    tileType: "grass",
    skyColor: "#e0f7fa",
    particles: "firefly",
    taskTemplate: [
      { id: "repair_bridges", label: "Repair Bridges", current: 0, target: 2 },
      { id: "lost_ducklings", label: "Help Lost Ducklings", current: 0, target: 4 },
      { id: "paper_boats", label: "Launch Paper Boats", current: 0, target: 3 },
      { id: "feed_fish", label: "Feed Colorful Fish", current: 0, target: 4 }
    ],
    generateLayout: (grid) => {
      // Grass with river flowing down center
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          if (c >= 14 && c <= 17) {
            grid[r][c] = 'w'; // water river
          } else {
            grid[r][c] = 'g'; // grass
          }
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 2 Broken Bridges crossing the river
      const bridgeRows = [6, 16];
      bridgeRows.forEach((row, idx) => {
        entities.push({
          type: 'bridge',
          sprite: 'tile_wood',
          x: 14 * TILE_SIZE,
          y: row * TILE_SIZE,
          width: 4 * TILE_SIZE,
          height: 1.5 * TILE_SIZE,
          repaired: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.repaired) return;
            self.repaired = true;
            self.interactive = false;
            level.updateTask("repair_bridges", 1);
            return [
              { speaker: "Mochi", text: "Clack! The bridge is safely repaired!" }
            ];
          }
        });
      });

      // Mama Duck & Lost Ducklings
      const mamaDuckX = 200;
      const mamaDuckY = 300;
      entities.push({
        type: 'npc',
        sprite: 'mama_duck',
        x: mamaDuckX,
        y: mamaDuckY,
        size: 32,
        interactive: true,
        dialogues: [
          { speaker: "Mama Duck", text: "Quack! My little ducklings are scattered along the riverbank!", expression: "sad" },
          { speaker: "Mama Duck", text: "They will follow you if you walk near them." }
        ]
      });

      const duckCoords = [
        { x: 100, y: 150 },
        { x: 80, y: 550 },
        { x: 860, y: 120 },
        { x: 920, y: 480 }
      ];
      duckCoords.forEach((coord, idx) => {
        entities.push({
          id: `duckling_${idx}`,
          type: 'duckling',
          sprite: 'duckling',
          x: coord.x,
          y: coord.y,
          size: 16,
          saved: false,
          interactive: true,
          following: false,
          onInteract: (player, self) => {
            if (self.saved) return;
            if (!self.following) {
              self.following = true;
              return [{ speaker: "Duckling", text: "Quack quack! (It's following you!)", expression: "happy" }];
            } else {
              const dist = Math.hypot(self.x - mamaDuckX, self.y - mamaDuckY);
              if (dist < 80) {
                self.following = false;
                self.saved = true;
                self.interactive = false;
                self.x = mamaDuckX + 24 + idx * 12;
                self.y = mamaDuckY + 16;
                level.updateTask("lost_ducklings", 1);
                return [{ speaker: "Mama Duck", text: "Thank you for finding my baby! Quack!", expression: "happy" }];
              } else {
                return [{ speaker: "Mochi", text: "Let's bring this duckling back to Mama Duck." }];
              }
            }
          }
        });
      });

      // Paper Boats to launch
      const boatCoords = [
        { x: 420, y: 180 },
        { x: 420, y: 400 },
        { x: 420, y: 650 }
      ];
      boatCoords.forEach((coord, idx) => {
        entities.push({
          type: 'boat',
          sprite: 'paper_boat',
          x: coord.x,
          y: coord.y,
          size: 20,
          launched: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.launched) return;
            self.launched = true;
            self.interactive = false;
            // Float boat into the river
            self.x = 15 * TILE_SIZE + 10;
            self.y = self.y + 20;
            level.updateTask("paper_boats", 1);
            return [
              { speaker: "Mochi", text: "We decorated the boat and pushed it into the stream!" },
              { speaker: "Mochi", text: "Watch it float away with the lantern..." }
            ];
          }
        });
      });

      // Colorful jumping fish to feed
      const fishCoords = [
        { x: 500, y: 100 },
        { x: 530, y: 280 },
        { x: 510, y: 520 },
        { x: 520, y: 700 }
      ];
      fishCoords.forEach((coord, idx) => {
        entities.push({
          type: 'fish',
          sprite: 'star', // using star as fish splash placeholder
          x: coord.x,
          y: coord.y,
          size: 16,
          fed: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.fed) return;
            self.fed = true;
            self.interactive = false;
            level.updateTask("feed_fish", 1);
            return [
              { speaker: "Mochi", text: "Splash! The fish leaped up and caught the breadcrumb!", expression: "happy" }
            ];
          }
        });
      });

      // Wishing Bottle Hidden Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle',
        x: 640,
        y: 620,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "A glass bottle washed ashore. There is a paper scroll inside!" },
            { speaker: "Letter", text: "\"My favorite wish already came true. ❤️\"" },
            { speaker: "Mochi", text: "...Whoever wrote this must be smiling.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 240,
        y: 620,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A cozy bench next to the whispering river." }]
      });

      return entities;
    }
  },

  // LEVEL 3: WHISPERING FOREST
  {
    id: 3,
    name: "Whispering Forest",
    theme: "Quiet Feelings",
    tileType: "grass",
    skyColor: "#eceff1",
    particles: "firefly",
    taskTemplate: [
      { id: "mushrooms", label: "Gather Glowing Mushrooms", current: 0, target: 6 },
      { id: "squirrels", label: "Feed Hungry Squirrels", current: 0, target: 4 },
      { id: "wake_owl", label: "Wake Up Sleepy Owl", current: 0, target: 1 },
      { id: "hedgehog", label: "Help the Lost Hedgehog", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      // Grass with lots of trees around boundaries
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 6 Glowing Mushrooms
      const mushCoords = [
        { x: 120, y: 150 },
        { x: 300, y: 220 },
        { x: 80, y: 550 },
        { x: 880, y: 180 },
        { x: 740, y: 640 },
        { x: 900, y: 580 }
      ];
      mushCoords.forEach((coord, idx) => {
        entities.push({
          type: 'mushroom',
          sprite: 'mushroom',
          x: coord.x,
          y: coord.y,
          size: 16,
          picked: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.picked) return;
            self.picked = true;
            self.interactive = false;
            level.updateTask("mushrooms", 1);
            return [{ speaker: "Mochi", text: "Picked a glowing mushroom!" }];
          }
        });
      });

      // 4 Hungry Squirrels
      const squirrelCoords = [
        { x: 220, y: 120 },
        { x: 800, y: 200 },
        { x: 260, y: 680 },
        { x: 620, y: 580 }
      ];
      squirrelCoords.forEach((coord, idx) => {
        entities.push({
          type: 'squirrel',
          sprite: 'chick', // placeholder squirrel
          x: coord.x,
          y: coord.y,
          size: 16,
          fed: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.fed) return [{ speaker: "Squirrel", text: "Chirp chirp! (It is full and happy!)" }];
            // Check if player has gathered at least one mushroom
            const mushTask = level.tasks.find(t => t.id === "mushrooms");
            if (mushTask && mushTask.current > 0) {
              self.fed = true;
              self.interactive = false;
              level.updateTask("squirrels", 1);
              return [
                { speaker: "Mochi", text: "I fed the squirrel a tasty mushroom!" },
                { speaker: "Squirrel", text: "*nibbles happily*", expression: "happy" }
              ];
            } else {
              return [{ speaker: "Mochi", text: "The squirrel looks hungry. Maybe it wants a glowing mushroom?" }];
            }
          }
        });
      });

      // Sleepy Owl
      entities.push({
        type: 'owl',
        sprite: 'owl',
        x: 480,
        y: 180,
        size: 32,
        awake: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.awake) return [{ speaker: "Owl", text: "Hoot... Thanks for the warm wake up." }];
          self.awake = true;
          level.updateTask("wake_owl", 1);
          return [
            { speaker: "Owl", text: "Yaaawn... Five more minutes...", expression: "sad" },
            { speaker: "Mochi", text: "*giggles*" }
          ];
        }
      });

      // Hedgehog to help
      entities.push({
        type: 'hedgehog',
        sprite: 'hedgehog',
        x: 150,
        y: 420,
        size: 24,
        helped: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.helped) return [{ speaker: "Hedgehog", text: "Thank you for untangling my spines!" }];
          self.helped = true;
          level.updateTask("hedgehog", 1);
          return [
            { speaker: "Hedgehog", text: "Ouch... I was stuck in these thorny branches!", expression: "sad" },
            { speaker: "Mochi", text: "Let me help you out. There you go!" },
            { speaker: "Hedgehog", text: "Thank you so much! ❤️", expression: "happy" }
          ];
        }
      });

      // Whispering Tree Hidden Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'glowing_flower',
        x: 512,
        y: 400,
        size: 24,
        activated: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.activated) return;
          self.activated = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "The wind is blowing through the giant ancient tree..." },
            { speaker: "Whispering Tree", text: "He talks about you more than you think." },
            { speaker: "Mochi", text: "...A warm draft carries the leaves.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 600,
        y: 350,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A quiet bench deep in the shadows of the forest." }]
      });

      return entities;
    }
  },

  // LEVEL 4: BLOOM GARDEN
  {
    id: 4,
    name: "Bloom Garden",
    theme: "Growing Together",
    tileType: "grass",
    skyColor: "#fce4ec",
    particles: "sakura",
    taskTemplate: [
      { id: "water_flowers", label: "Water Sleeping Buds", current: 0, target: 6 },
      { id: "guide_bees", label: "Lead Bees to Flowers", current: 0, target: 3 },
      { id: "match_butterflies", label: "Match Color Butterflies", current: 0, target: 3 },
      { id: "repair_fountain", label: "Restore Rainbow Fountain", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      // Grass with path loop (garden hedge style)
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r === 4 || r === 18 || c === 4 || c === 28) ? 'd' : 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 6 flowers to water
      const waterCoords = [
        { x: 100, y: 100 },
        { x: 900, y: 100 },
        { x: 100, y: 650 },
        { x: 900, y: 650 },
        { x: 300, y: 350 },
        { x: 700, y: 350 }
      ];
      waterCoords.forEach((coord, idx) => {
        entities.push({
          type: 'flower_bud',
          sprite: 'flower_gray',
          x: coord.x,
          y: coord.y,
          size: 16,
          watered: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.watered) return;
            self.watered = true;
            self.interactive = false;
            self.sprite = idx % 2 === 0 ? 'flower_red' : 'flower_yellow';
            level.updateTask("water_flowers", 1);
            return [{ speaker: "Mochi", text: "The bud bloomed beautifully!", expression: "happy" }];
          }
        });
      });

      // Rainbow Fountain (center of garden)
      entities.push({
        type: 'fountain',
        sprite: 'tile_stone',
        x: 480,
        y: 350,
        size: 48,
        repaired: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.repaired) return [{ speaker: "Mochi", text: "The fountain sparkles with rainbow water!" }];
          self.repaired = true;
          level.updateTask("repair_fountain", 1);
          return [
            { speaker: "Mochi", text: "We cleared the stones and fixed the pipes..." },
            { speaker: "Mochi", text: "Look! A beautiful rainbow arch formed over the water!", expression: "happy" }
          ];
        }
      });

      // 3 Bees to guide
      const beeCoords = [
        { x: 180, y: 220 },
        { x: 800, y: 150 },
        { x: 260, y: 550 }
      ];
      beeCoords.forEach((coord, idx) => {
        entities.push({
          type: 'bee',
          sprite: 'star', // simple spark placeholder for bee
          x: coord.x,
          y: coord.y,
          size: 10,
          saved: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.saved) return;
            self.saved = true;
            self.interactive = false;
            // fly to fountain
            self.x = 480 + (idx - 1) * 30;
            self.y = 350;
            level.updateTask("guide_bees", 1);
            return [{ speaker: "Mochi", text: "Buzz! The bee flew over to the fountain flowers!" }];
          }
        });
      });

      // Color matching butterflies
      const butCoords = [
        { x: 150, y: 300, color: 'red' },
        { x: 860, y: 300, color: 'blue' },
        { x: 500, y: 650, color: 'yellow' }
      ];
      butCoords.forEach((coord, idx) => {
        entities.push({
          type: 'butterfly_match',
          sprite: 'butterfly',
          x: coord.x,
          y: coord.y,
          size: 16,
          matched: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.matched) return;
            self.matched = true;
            self.interactive = false;
            level.updateTask("match_butterflies", 1);
            return [
              { speaker: "Mochi", text: `A pretty ${coord.color} butterfly lands on my head!`, expression: "happy" }
            ];
          }
        });
      });

      // Favorite flower Hidden Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'glowing_flower',
        x: 512,
        y: 220,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "This unique flower is blooming into your favorite kind!" },
            { speaker: "Letter", text: "\"If I had to choose one flower... I'd still choose the one that reminds me of you.\"" },
            { speaker: "Mochi", text: "Some flowers bloom only for the right person.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 480,
        y: 520,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A white bench surrounded by lavender blooms." }]
      });

      return entities;
    }
  },

  // LEVEL 5: COZY CASTLE
  {
    id: 5,
    name: "Cozy Castle",
    theme: "Feeling at Home",
    tileType: "stone",
    skyColor: "#cfd8dc",
    particles: "firefly",
    taskTemplate: [
      { id: "cupcakes", label: "Bake Cupcakes", current: 0, target: 1 },
      { id: "lanterns", label: "Light Fireplace Lanterns", current: 0, target: 5 },
      { id: "castle_mice", label: "Help Tiny Castle Mice", current: 0, target: 3 },
      { id: "prepare_tea", label: "Prepare Tea for Queen", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      // Stone floors
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 's'; // stone floor
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // Cupcake baking station
      entities.push({
        type: 'baking_oven',
        sprite: 'tile_dirt', // placeholder oven
        x: 200,
        y: 200,
        size: 32,
        done: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.done) return [{ speaker: "Mochi", text: "Mmm, the cupcakes smell delicious!" }];
          self.done = true;
          level.updateTask("cupcakes", 1);
          return [
            { speaker: "Mochi", text: "Mixing sugar, flour, and sprinkles..." },
            { speaker: "Oven", text: "*Jiggles and rings ding!*" },
            { speaker: "Mochi", text: "Fresh warm cupcakes! That smells amazing.", expression: "happy" }
          ];
        }
      });

      // 5 wall lanterns to light
      const lanCoords = [
        { x: 100, y: 100 },
        { x: 450, y: 100 },
        { x: 850, y: 100 },
        { x: 100, y: 550 },
        { x: 850, y: 550 }
      ];
      lanCoords.forEach((coord, idx) => {
        entities.push({
          type: 'lantern_light',
          sprite: 'lantern',
          x: coord.x,
          y: coord.y,
          size: 16,
          lit: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.lit) return;
            self.lit = true;
            level.updateTask("lanterns", 1);
            // Spawn firefly particles near lantern
            Particles.spawnFirefly(15, 200, 200, true);
            return [{ speaker: "Mochi", text: "Lantern lit! Tiny glowing fireflies floated out.", expression: "happy" }];
          }
        });
      });

      // 3 castle mice
      const mouseCoords = [
        { x: 300, y: 500 },
        { x: 600, y: 520 },
        { x: 800, y: 300 }
      ];
      mouseCoords.forEach((coord, idx) => {
        entities.push({
          type: 'mouse_cheese',
          sprite: 'mouse',
          x: coord.x,
          y: coord.y,
          size: 16,
          helped: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.helped) return [{ speaker: "Mouse", text: "Squeak! Thank you!" }];
            self.helped = true;
            self.interactive = false;
            level.updateTask("castle_mice", 1);
            return [
              { speaker: "Mouse", text: "Squeak! The cheese wheel was too heavy to carry alone!", expression: "sad" },
              { speaker: "Mochi", text: "I'll roll it into your hole. There!" },
              { speaker: "Mouse", text: "Squeak! Thank you, kind bunny!", expression: "happy" }
            ];
          }
        });
      });

      // Prepare Tea for the Queen
      entities.push({
        type: 'tea_table',
        sprite: 'bench', // placeholder table
        x: 512,
        y: 350,
        size: 48,
        prepared: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.prepared) return [{ speaker: "Mochi", text: "The Queen's tea is already served." }];
          // Require cupcakes to be baked first
          const cupTask = level.tasks.find(t => t.id === "cupcakes");
          if (cupTask && cupTask.current > 0) {
            self.prepared = true;
            level.updateTask("prepare_tea", 1);
            return [
              { speaker: "Mochi", text: "Placing teacups and serving the warm cupcakes." },
              { speaker: "Queen", text: "This looks delightful! May every home be filled with laughter.", expression: "happy" }
            ];
          } else {
            return [{ speaker: "Mochi", text: "We need cupcakes to go with the tea! Let's bake some first." }];
          }
        }
      });

      // Hidden Room Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle', // placeholder note container
        x: 880,
        y: 200,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "Inside this secret lockbox is a recipe card...", expression: "happy" },
            { speaker: "Recipe Card", text: "\"Everything tastes sweeter when it's shared. ❤️\"" },
            { speaker: "Mochi", text: "I think someone hoped you'd find this." }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 480,
        y: 500,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A royal velvet bench." }]
      });

      return entities;
    }
  },

  // LEVEL 6: MELODY VILLAGE
  {
    id: 6,
    name: "Melody Village",
    theme: "The Songs That Stay With Us",
    tileType: "grass",
    skyColor: "#fff9c4",
    particles: "firefly",
    taskTemplate: [
      { id: "instruments", label: "Repair Instruments", current: 0, target: 4 },
      { id: "song_notes", label: "Order Song Notes", current: 0, target: 1 },
      { id: "ring_bells", label: "Ring Tower Bells", current: 0, target: 5 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r >= 8 && r <= 15) ? 'd' : 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];
      
      // Instruments (Piano, Violin, Guitar, Flute)
      const instNames = ["Piano", "Violin", "Guitar", "Flute"];
      const instCoords = [
        { x: 120, y: 150 },
        { x: 280, y: 220 },
        { x: 800, y: 550 },
        { x: 920, y: 180 }
      ];
      instCoords.forEach((coord, idx) => {
        entities.push({
          type: 'instrument',
          name: instNames[idx],
          sprite: 'cupcake', // placeholder instrument
          x: coord.x,
          y: coord.y,
          size: 24,
          repaired: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.repaired) return [{ speaker: "Mochi", text: `The ${self.name} is playing a beautiful melody!` }];
            self.repaired = true;
            level.updateTask("instruments", 1);
            return [
              { speaker: "Mochi", text: `I restrung and tuned the old ${self.name}...` },
              { speaker: "Instrument", text: "*Plays a gorgeous chord!*" },
              { speaker: "Mochi", text: "It sounds lovely! Music is starting to return.", expression: "happy" }
            ];
          }
        });
      });

      // Song Notes ordering puzzle
      entities.push({
        type: 'song_order',
        sprite: 'star',
        x: 480,
        y: 200,
        size: 20,
        solved: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.solved) return [{ speaker: "Children", text: "La la la~ We love our song!" }];
          self.solved = true;
          level.updateTask("song_notes", 1);
          return [
            { speaker: "Children", text: "We forgot the order of the notes in our song sheet!", expression: "sad" },
            { speaker: "Mochi", text: "Let's arrange them: Do, Mi, Sol, Do!" },
            { speaker: "Children", text: "Yes! That's it! *singing in tune*", expression: "happy" }
          ];
        }
      });

      // 5 Tower Bells
      for (let i = 0; i < 5; i++) {
        entities.push({
          type: 'bell',
          sprite: 'teacup', // placeholder bell
          x: 400 + i * 50,
          y: 450,
          size: 16,
          rung: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.rung) return [{ speaker: "Mochi", text: "*Clang!* Sounded clear!" }];
            self.rung = true;
            level.updateTask("ring_bells", 1);
            return [{ speaker: "Bell", text: "*Diiiiing!* A rich resonance spreads across the village.", expression: "happy" }];
          }
        });
      }

      // Hidden Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'glowing_flower',
        x: 750,
        y: 150,
        size: 16,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "A glowing musical sheet rests in the quiet Piano Cafe." },
            { speaker: "Music Sheet", text: "\"Every beautiful memory has its own melody. ❤️\"" },
            { speaker: "Mochi", text: "Maybe... this one reminds someone of you.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 520,
        y: 600,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A musical bench that hums a soft note when sat upon." }]
      });

      return entities;
    }
  },

  // LEVEL 7: SNOWFLAKE VILLAGE
  {
    id: 7,
    name: "Snowflake Village",
    theme: "Warmth During Cold Days",
    tileType: "snow",
    skyColor: "#e1f5fe",
    particles: "snow",
    taskTemplate: [
      { id: "hot_chocolate", label: "Deliver Hot Chocolates", current: 0, target: 4 },
      { id: "snow_bunnies", label: "Build Snow Bunnies", current: 0, target: 3 },
      { id: "fireplaces", label: "Light Fireplaces", current: 0, target: 4 },
      { id: "snowmen", label: "Decorate Snowmen", current: 0, target: 2 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 'x'; // snow tile
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // Deliver Hot Chocolate to 4 houses
      for (let i = 0; i < 4; i++) {
        entities.push({
          type: 'house_deliver',
          sprite: 'tile_dirt', // placeholder house
          x: 120 + i * 260,
          y: 200,
          size: 48,
          delivered: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.delivered) return [{ speaker: "Villager", text: "Thanks for the warm cocoa! Keep cozy!" }];
            self.delivered = true;
            level.updateTask("hot_chocolate", 1);
            return [
              { speaker: "Mochi", text: "Here is your steaming mug of rich hot chocolate!" },
              { speaker: "Villager", text: "Oh, it warms my frozen fingers! Thank you, friend!", expression: "happy" }
            ];
          }
        });
      }

      // Build 3 Snow Bunnies
      const sbCoords = [
        { x: 300, y: 550 },
        { x: 500, y: 520 },
        { x: 700, y: 580 }
      ];
      sbCoords.forEach((coord, idx) => {
        entities.push({
          type: 'snow_bunny',
          sprite: 'star',
          x: coord.x,
          y: coord.y,
          size: 16,
          built: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.built) return [{ speaker: "Mochi", text: "A tiny snow bunny! It looks like me!" }];
            self.built = true;
            self.sprite = 'mochi_sleeping';
            level.updateTask("snow_bunnies", 1);
            return [{ speaker: "Mochi", text: "Sculpting snow ears... Added pink leaf cheeks. Done!", expression: "happy" }];
          }
        });
      });

      // Light 4 Fireplaces
      const fireCoords = [
        { x: 80, y: 350 },
        { x: 320, y: 350 },
        { x: 580, y: 350 },
        { x: 840, y: 350 }
      ];
      fireCoords.forEach((coord, idx) => {
        entities.push({
          type: 'fireplace',
          sprite: 'lantern',
          x: coord.x,
          y: coord.y,
          size: 20,
          lit: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.lit) return [{ speaker: "Fireplace", text: "Warm wood crackles cozy." }];
            self.lit = true;
            level.updateTask("fireplaces", 1);
            return [{ speaker: "Mochi", text: "Stoked the logs and lit the fire. Ah, so warm!", expression: "happy" }];
          }
        });
      });

      // Decorate 2 Snowmen
      const smCoords = [
        { x: 200, y: 450 },
        { x: 800, y: 450 }
      ];
      smCoords.forEach((coord, idx) => {
        entities.push({
          type: 'snowman',
          sprite: 'penguin', // placeholder snowman
          x: coord.x,
          y: coord.y,
          size: 24,
          decorated: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.decorated) return [{ speaker: "Snowman", text: "*Smiles with carrot nose*" }];
            self.decorated = true;
            level.updateTask("snowmen", 1);
            return [{ speaker: "Mochi", text: "I added a warm scarf and a carrot nose. How dapper!", expression: "happy" }];
          }
        });
      });

      // Hidden Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'teacup',
        x: 480,
        y: 620,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "A warm mug sits beside a cracking fireplace." },
            { speaker: "Mug", text: "\"The warmest place has always been beside you. ❤️\"" },
            { speaker: "Mochi", text: "Some memories never get cold.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 520,
        y: 420,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A wooden bench swept clean of snow." }]
      });

      return entities;
    }
  },

  // LEVEL 8: STAR OBSERVATORY
  {
    id: 8,
    name: "Star Observatory",
    theme: "Dreams Bigger Than The Sky",
    tileType: "stone",
    skyColor: "#1a237e",
    particles: "firefly",
    taskTemplate: [
      { id: "collect_stars", label: "Catch Falling Stars", current: 0, target: 5 },
      { id: "telescope", label: "Repair Giant Telescope", current: 0, target: 1 },
      { id: "constellations", label: "Connect Constellations", current: 0, target: 3 },
      { id: "sky_lanterns", label: "Release Sky Lanterns", current: 0, target: 4 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 's';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 5 Falling Stars
      for (let i = 0; i < 5; i++) {
        entities.push({
          type: 'star_catch',
          sprite: 'star',
          x: 100 + Math.random() * 800,
          y: 100 + Math.random() * 550,
          size: 16,
          caught: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.caught) return;
            self.caught = true;
            self.interactive = false;
            level.updateTask("collect_stars", 1);
            return [{ speaker: "Mochi", text: "Caught a sparkling falling star!" }];
          }
        });
      }

      // Repair Telescope
      entities.push({
        type: 'telescope',
        sprite: 'tile_stone',
        x: 480,
        y: 250,
        size: 48,
        repaired: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.repaired) {
            // Trigger hidden memory initials display
            level.foundMemory = true;
            return [
              { speaker: "Mochi", text: "Looking through the lens... A faint cluster of stars slowly shifts." },
              { speaker: "Telescope", text: "Look! The stars form our initials together!" },
              { speaker: "Mochi", text: "Some stars only shine for the right people.", expression: "happy" }
            ];
          }
          self.repaired = true;
          level.updateTask("telescope", 1);
          return [
            { speaker: "Mochi", text: "Wiped the heavy dust off the giant lenses and aligned gears..." },
            { speaker: "Mochi", text: "The eyepiece is clear! We can stargaze now.", expression: "happy" }
          ];
        }
      });

      // Connect 3 Constellations
      const conNames = ["Pegasus", "Cassiopeia", "Ursa Major"];
      const conCoords = [
        { x: 200, y: 150 },
        { x: 800, y: 150 },
        { x: 800, y: 500 }
      ];
      conCoords.forEach((coord, idx) => {
        entities.push({
          type: 'constellation',
          name: conNames[idx],
          sprite: 'star',
          x: coord.x,
          y: coord.y,
          size: 20,
          connected: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.connected) return [{ speaker: "Mochi", text: `The ${self.name} constellation glows brightly.` }];
            self.connected = true;
            level.updateTask("constellations", 1);
            return [
              { speaker: "Mochi", text: `Drawing lines between stars for ${self.name}...` },
              { speaker: "Sky", text: "*Lines of golden light connect!*", expression: "happy" }
            ];
          }
        });
      });

      // Release 4 Sky Lanterns
      const lanternCoords = [
        { x: 260, y: 400 },
        { x: 420, y: 450 },
        { x: 580, y: 450 },
        { x: 740, y: 400 }
      ];
      lanternCoords.forEach((coord, idx) => {
        entities.push({
          type: 'sky_lantern',
          sprite: 'lantern',
          x: coord.x,
          y: coord.y,
          size: 16,
          released: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.released) return;
            self.released = true;
            self.interactive = false;
            // Float up
            self.y = -100;
            level.updateTask("sky_lanterns", 1);
            return [{ speaker: "Mochi", text: "Released! Watch the warm light float into the dark sky." }];
          }
        });
      });

      // Hidden Memory is triggered directly via interacting with repaired telescope (handled inside telescope onInteract)

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 480,
        y: 480,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A stone bench facing the vast milky way." }]
      });

      return entities;
    }
  },

  // LEVEL 9: COLOR WORKSHOP
  {
    id: 9,
    name: "Color Workshop",
    theme: "Bringing Color Back",
    tileType: "stone",
    skyColor: "#f5f5f5",
    grayscale: true, // Custom level property to apply grayscale filter
    taskTemplate: [
      { id: "paint_houses", label: "Paint Grayscale Houses", current: 0, target: 3 },
      { id: "paint_murals", label: "Restore Town Murals", current: 0, target: 2 },
      { id: "color_butterflies", label: "Paint Dull Butterflies", current: 0, target: 4 },
      { id: "rainbow_bridge", label: "Color the Rainbow Bridge", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 's';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // Paint 3 Houses
      for (let i = 0; i < 3; i++) {
        entities.push({
          type: 'house_paint',
          sprite: 'tile_dirt',
          x: 150 + i * 320,
          y: 200,
          size: 48,
          painted: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.painted) return [{ speaker: "Mochi", text: "This house is bright and colorful now!" }];
            self.painted = true;
            level.updateTask("paint_houses", 1);
            return [{ speaker: "Mochi", text: "Splash! Swiped some bright pastel paint. Beautiful!" }];
          }
        });
      }

      // Restore 2 Murals
      const muralCoords = [
        { x: 80, y: 450 },
        { x: 860, y: 450 }
      ];
      muralCoords.forEach((coord, idx) => {
        entities.push({
          type: 'mural',
          sprite: 'bench',
          x: coord.x,
          y: coord.y,
          size: 32,
          painted: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.painted) return [{ speaker: "Mochi", text: "The wall mural glows with happy colors." }];
            self.painted = true;
            level.updateTask("paint_murals", 1);
            return [{ speaker: "Mochi", text: "Painting details of flowers, sun and skies on the stone wall." }];
          }
        });
      });

      // Color 4 Butterflies
      for (let i = 0; i < 4; i++) {
        entities.push({
          type: 'butterfly_paint',
          sprite: 'butterfly',
          x: 100 + i * 220,
          y: 500,
          size: 16,
          painted: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.painted) return;
            self.painted = true;
            self.interactive = false;
            level.updateTask("color_butterflies", 1);
            return [{ speaker: "Mochi", text: "I painted its wings soft pink. Off it flaps!" }];
          }
        });
      }

      // Rainbow Bridge
      entities.push({
        type: 'rainbow_bridge',
        sprite: 'tile_wood',
        x: 480,
        y: 350,
        size: 48,
        painted: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.painted) return [{ speaker: "Mochi", text: "The bridge spans in seven colorful stripes." }];
          self.painted = true;
          level.updateTask("rainbow_bridge", 1);
          return [{ speaker: "Mochi", text: "Painting red, orange, yellow, green, blue, violet..." }];
        }
      });

      // Hidden Canvas Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle',
        x: 880,
        y: 120,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "A blank canvas rests on a dusty easel. Let's paint it!" },
            { speaker: "Mochi", text: "As the colors blend, a picture appears..." },
            { speaker: "Painting", text: "It's a chibi illustration of us walking together under a shared umbrella." },
            { speaker: "Mochi", text: "That's a beautiful picture...", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 520,
        y: 450,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "An unpainted bench waiting for brushes." }]
      });

      return entities;
    }
  },

  // LEVEL 10: COURAGE MOUNTAIN
  {
    id: 10,
    name: "Courage Mountain",
    theme: "Supporting Each Other",
    tileType: "stone",
    skyColor: "#eceff1",
    particles: "sakura",
    taskTemplate: [
      { id: "bridges", label: "Repair Rope Bridges", current: 0, target: 2 },
      { id: "plant_flowers", label: "Plant Cliff Flowers", current: 0, target: 5 },
      { id: "mountain_goats", label: "Help Lost Mountain Goats", current: 0, target: 3 },
      { id: "light_beacon", label: "Light Summit Beacon", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r >= 6 && r <= 17 && c >= 6 && c <= 25) ? 's' : 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 2 Rope Bridges
      const bridgeCoords = [
        { x: 120, y: 350 },
        { x: 800, y: 350 }
      ];
      bridgeCoords.forEach((coord, idx) => {
        entities.push({
          type: 'rope_bridge',
          sprite: 'tile_wood',
          x: coord.x,
          y: coord.y,
          size: 32,
          repaired: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.repaired) return;
            self.repaired = true;
            self.interactive = false;
            level.updateTask("bridges", 1);
            return [{ speaker: "Mochi", text: "Tied the ropes secure! The bridge is safe to cross now." }];
          }
        });
      });

      // Plant 5 Cliff Flowers
      for (let i = 0; i < 5; i++) {
        entities.push({
          type: 'plant_spot',
          sprite: 'tile_dirt',
          x: 200 + i * 160,
          y: 200,
          size: 16,
          planted: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.planted) return;
            self.planted = true;
            self.sprite = 'flower_red';
            level.updateTask("plant_flowers", 1);
            return [{ speaker: "Mochi", text: "Planted a mountain flower in the rock crevice!", expression: "happy" }];
          }
        });
      }

      // Help 3 Goats
      const goatCoords = [
        { x: 100, y: 150 },
        { x: 860, y: 180 },
        { x: 480, y: 550 }
      ];
      goatCoords.forEach((coord, idx) => {
        entities.push({
          type: 'mountain_goat',
          sprite: 'mountain_goat',
          x: coord.x,
          y: coord.y,
          size: 24,
          helped: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.helped) return [{ speaker: "Goat", text: "Baaah! (Chews grass happily)" }];
            self.helped = true;
            level.updateTask("mountain_goats", 1);
            return [
              { speaker: "Goat", text: "Baaah! I was stuck on this steep cliff face!", expression: "sad" },
              { speaker: "Mochi", text: "Let me pull you up. Gently... gotcha!" },
              { speaker: "Goat", text: "Baaah! Thank you!", expression: "happy" }
            ];
          }
        });
      });

      // Light Summit Beacon
      entities.push({
        type: 'beacon',
        sprite: 'lantern',
        x: 480,
        y: 100,
        size: 32,
        lit: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.lit) return [{ speaker: "Mochi", text: "The summit beacon shines like a lighthouse." }];
          self.lit = true;
          level.updateTask("light_beacon", 1);
          return [
            { speaker: "Mochi", text: "I fired the dry twigs in the beacon pit..." },
            { speaker: "Beacon", text: "*Whoosh! A tall golden fire erupts!*", expression: "happy" }
          ];
        }
      });

      // Hidden Memory sign
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle',
        x: 520,
        y: 350,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "There is an old wooden sign covered in dirt. Let's wipe it clean." },
            { speaker: "Sign", text: "\"Wish you were here...\"" },
            { speaker: "Sign", text: "\"...Oh wait, you are. ❤️\"" },
            { speaker: "Mochi", text: "I like whoever wrote that.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 420,
        y: 450,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A wooden bench on the edge of the world." }]
      });

      return entities;
    }
  },

  // LEVEL 11: FESTIVAL OF SMILES
  {
    id: 11,
    name: "Festival of Smiles",
    theme: "Happiness Is Better When Shared",
    tileType: "grass",
    skyColor: "#ffe0b2",
    particles: "firefly",
    taskTemplate: [
      { id: "win_games", label: "Win Carnival Games", current: 0, target: 4 },
      { id: "find_parents", label: "Help Lost Kids Find Parents", current: 0, target: 2 },
      { id: "decorate_street", label: "Decorate Lantern Street", current: 0, target: 5 },
      { id: "festival_cake", label: "Help Baker Bake Cake", current: 0, target: 1 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r >= 8 && r <= 15) ? 'd' : 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 4 Carnival Games
      const games = ["Ring Toss", "Balloon Pop", "Duck Fishing", "Hoop Throw"];
      games.forEach((game, idx) => {
        entities.push({
          type: 'carnival_game',
          name: game,
          sprite: 'star',
          x: 100 + idx * 240,
          y: 200,
          size: 24,
          won: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.won) return [{ speaker: "Mochi", text: `I already won the ${self.name} ticket!` }];
            self.won = true;
            level.updateTask("win_games", 1);
            return [
              { speaker: "Booth Manager", text: `Welcome to the ${self.name}! Press Space to play.` },
              { speaker: "Mochi", text: "*Takes aim and throws...*" },
              { speaker: "Booth Manager", text: "Perfect hit! You win a prize token!", expression: "happy" }
            ];
          }
        });
      });

      // Find Parents
      const lostCoords = [
        { x: 80, y: 550 },
        { x: 880, y: 550 }
      ];
      lostCoords.forEach((coord, idx) => {
        entities.push({
          type: 'lost_child',
          sprite: 'chick',
          x: coord.x,
          y: coord.y,
          size: 16,
          saved: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.saved) return;
            self.saved = true;
            self.interactive = false;
            level.updateTask("find_parents", 1);
            return [
              { speaker: "Child", text: "I lost my parents in the festival crowd!", expression: "sad" },
              { speaker: "Mochi", text: "Let's find them together... Oh, look, there they are!" },
              { speaker: "Parents", text: "Thank you for bringing our child back!", expression: "happy" }
            ];
          }
        });
      });

      // Decorate Lantern Street
      for (let i = 0; i < 5; i++) {
        entities.push({
          type: 'lantern_hang',
          sprite: 'lantern',
          x: 150 + i * 160,
          y: 400,
          size: 16,
          hung: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.hung) return;
            self.hung = true;
            level.updateTask("decorate_street", 1);
            return [{ speaker: "Mochi", text: "Hunted a lantern and lit it. The street looks festive!", expression: "happy" }];
          }
        });
      }

      // Help Baker
      entities.push({
        type: 'baker_cake',
        sprite: 'cupcake',
        x: 480,
        y: 600,
        size: 32,
        done: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.done) return [{ speaker: "Baker", text: "This giant cake is ready for the festival crowd!" }];
          self.done = true;
          level.updateTask("festival_cake", 1);
          return [
            { speaker: "Baker", text: "I need sugar, eggs, and cherries to top the giant cake!", expression: "sad" },
            { speaker: "Mochi", text: "Let me fetch them. Here you go!" },
            { speaker: "Baker", text: "Splendid! Look how tall it grows!", expression: "happy" }
          ];
        }
      });

      // Hidden Plush Shop Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle',
        x: 900,
        y: 120,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "A fluffy plush bunny sits alone in a glass corner..." },
            { speaker: "Plush Tag", text: "\"I hope this little bunny reminds you that someone is always cheering for you.\"" },
            { speaker: "Mochi", text: "I'd keep this bunny forever.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 520,
        y: 500,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A festive bench covered in confetti." }]
      });

      return entities;
    }
  },

  // LEVEL 12: DREAM ISLANDS
  {
    id: 12,
    name: "Dream Islands",
    theme: "Every Dream Begins Somewhere",
    tileType: "grass",
    skyColor: "#e1f5fe",
    particles: "bubble",
    taskTemplate: [
      { id: "dream_bubbles", label: "Collect Dream Bubbles", current: 0, target: 6 },
      { id: "cloud_spirits", label: "Wake Cloud Spirits", current: 0, target: 4 },
      { id: "rainbow_bridges", label: "Rebuild Rainbow Bridges", current: 0, target: 2 },
      { id: "feathers", label: "Catch Floating Feathers", current: 0, target: 4 }
    ],
    generateLayout: (grid) => {
      // Scattered floating islands on blue sky background
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r >= 5 && r <= 18 && c >= 4 && c <= 27) ? 'g' : 'w'; // grass islands, sky surrounds
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // Collect 6 bubbles
      for (let i = 0; i < 6; i++) {
        entities.push({
          type: 'bubble_collect',
          sprite: 'star',
          x: 100 + i * 160,
          y: 250 + Math.sin(i) * 100,
          size: 16,
          collected: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.collected) return;
            self.collected = true;
            self.interactive = false;
            level.updateTask("dream_bubbles", 1);
            return [{ speaker: "Mochi", text: "Pop! Collected a glowing dream bubble." }];
          }
        });
      }

      // Wake 4 Cloud Spirits
      const spiritCoords = [
        { x: 150, y: 150 },
        { x: 800, y: 150 },
        { x: 150, y: 550 },
        { x: 800, y: 550 }
      ];
      spiritCoords.forEach((coord, idx) => {
        entities.push({
          type: 'cloud_spirit',
          sprite: 'cloud_spirit',
          x: coord.x,
          y: coord.y,
          size: 24,
          awake: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.awake) return [{ speaker: "Cloud Spirit", text: "Yaaawn... Floating is fun." }];
            self.awake = true;
            level.updateTask("cloud_spirits", 1);
            return [{ speaker: "Cloud Spirit", text: "Huuuuh... Thanks for waking me. The dream was soft!", expression: "happy" }];
          }
        });
      });

      // Rebuild 2 Rainbow Bridges
      const bridgeCoords = [
        { x: 260, y: 350 },
        { x: 740, y: 350 }
      ];
      bridgeCoords.forEach((coord, idx) => {
        entities.push({
          type: 'rainbow_bridge',
          sprite: 'tile_wood',
          x: coord.x,
          y: coord.y,
          size: 32,
          repaired: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.repaired) return;
            self.repaired = true;
            self.interactive = false;
            level.updateTask("rainbow_bridges", 1);
            return [{ speaker: "Mochi", text: "A bridge of colorful light formed to the next island!", expression: "happy" }];
          }
        });
      });

      // Catch 4 Floating Feathers
      for (let i = 0; i < 4; i++) {
        entities.push({
          type: 'feather',
          sprite: 'star',
          x: 200 + i * 200,
          y: 450,
          size: 16,
          caught: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.caught) return;
            self.caught = true;
            self.interactive = false;
            level.updateTask("feathers", 1);
            return [{ speaker: "Mochi", text: "Caught a soft white floating feather!" }];
          }
        });
      }

      // Hidden Memory Bubble
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle',
        x: 480,
        y: 420,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "This bubble doesn't pop... look inside!" },
            { speaker: "Bubble", text: "A tiny scene of chibi you and your girlfriend sitting together watching a golden sunset." },
            { speaker: "Mochi", text: "Some moments don't need words...", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 480,
        y: 520,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A bench floating in the clouds." }]
      });

      return entities;
    }
  },

  // LEVEL 13: MEMORY GROVE
  {
    id: 13,
    name: "Memory Grove",
    theme: "Looking Back Without Letting Go",
    tileType: "grass",
    skyColor: "#efebe9",
    particles: "firefly",
    taskTemplate: [
      { id: "light_lanterns", label: "Light Forgotten Lanterns", current: 0, target: 6 },
      { id: "keepsakes", label: "Return Keepsakes", current: 0, target: 3 },
      { id: "broken_bridges", label: "Repair Old Bridges", current: 0, target: 2 },
      { id: "memory_frags", label: "Find Memory Fragments", current: 0, target: 5 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // 6 Lanterns to light
      for (let i = 0; i < 6; i++) {
        entities.push({
          type: 'lantern_grove',
          sprite: 'lantern',
          x: 100 + i * 160,
          y: 180 + Math.sin(i) * 50,
          size: 16,
          lit: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.lit) return;
            self.lit = true;
            level.updateTask("light_lanterns", 1);
            return [{ speaker: "Mochi", text: "The ancient lantern glows warm." }];
          }
        });
      }

      // Return keepsakes to 3 villagers
      const keepsakeNames = ["Bracelet", "Keychain", "Ring"];
      const villCoords = [
        { x: 120, y: 400 },
        { x: 480, y: 550 },
        { x: 840, y: 400 }
      ];
      villCoords.forEach((coord, idx) => {
        entities.push({
          type: 'villager_keepsake',
          name: keepsakeNames[idx],
          sprite: 'cloud_spirit',
          x: coord.x,
          y: coord.y,
          size: 24,
          helped: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.helped) return [{ speaker: "Villager", text: `Thanks for the keepsake! It is very precious.` }];
            self.helped = true;
            level.updateTask("keepsakes", 1);
            return [
              { speaker: "Villager", text: `I lost my favorite old ${self.name}!`, expression: "sad" },
              { speaker: "Mochi", text: `I found it tucked in the grass. Here!` },
              { speaker: "Villager", text: "Oh, thank you! It holds so many sweet memories.", expression: "happy" }
            ];
          }
        });
      });

      // 2 Broken Bridges
      const bridgeCoords = [
        { x: 260, y: 320 },
        { x: 740, y: 320 }
      ];
      bridgeCoords.forEach((coord, idx) => {
        entities.push({
          type: 'grove_bridge',
          sprite: 'tile_wood',
          x: coord.x,
          y: coord.y,
          size: 32,
          repaired: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.repaired) return;
            self.repaired = true;
            self.interactive = false;
            level.updateTask("broken_bridges", 1);
            return [{ speaker: "Mochi", text: "Placed the planks back in order. Fixed!" }];
          }
        });
      });

      // 5 Memory Fragments
      for (let i = 0; i < 5; i++) {
        entities.push({
          type: 'fragment',
          sprite: 'star',
          x: 100 + Math.random() * 800,
          y: 200 + Math.random() * 400,
          size: 16,
          collected: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.collected) return;
            self.collected = true;
            self.interactive = false;
            level.updateTask("memory_frags", 1);
            return [{ speaker: "Mochi", text: "Sparkle! Restored a fragment of a memory." }];
          }
        });
      }

      // Hidden Memory bench
      entities.push({
        type: 'hidden_memory',
        sprite: 'bench',
        x: 480,
        y: 350,
        size: 48,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "A soft letter rests on the wooden bench..." },
            { speaker: "Letter", text: "\"No matter where life takes us... I hope we always find our way back to each other. ❤️\"" },
            { speaker: "Mochi", text: "Some things become priceless because of who gave them.", expression: "happy" }
          ];
        }
      });

      return entities;
    }
  },

  // LEVEL 14: HEART KINGDOM
  {
    id: 14,
    name: "Heart Kingdom",
    theme: "Every Memory Leads Home",
    tileType: "stone",
    skyColor: "#ffebee",
    particles: "sakura",
    taskTemplate: [
      { id: "celebration", label: "Prepare Celebration Streets", current: 0, target: 1 },
      { id: "giant_cake", label: "Bake Kingdom Cake", current: 0, target: 1 },
      { id: "banners", label: "Hang Welcome Banners", current: 0, target: 4 },
      { id: "kingdom_flowers", label: "Plant Heart Blossoms", current: 0, target: 5 }
    ],
    generateLayout: (grid) => {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = 's';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // Waving NPCs from past levels
      entities.push({
        type: 'npc_greeting',
        sprite: 'cat_happy',
        x: 100,
        y: 200,
        size: 24,
        interactive: true,
        dialogues: [{ speaker: "Meadow Cat", text: "Meow! Welcome back, Mochi!", expression: "happy" }]
      });

      entities.push({
        type: 'npc_greeting',
        sprite: 'mama_duck',
        x: 200,
        y: 220,
        size: 32,
        interactive: true,
        dialogues: [{ speaker: "Mama Duck", text: "Quack! Look, we're all here!", expression: "happy" }]
      });

      entities.push({
        type: 'npc_greeting',
        sprite: 'owl',
        x: 800,
        y: 200,
        size: 32,
        interactive: true,
        dialogues: [{ speaker: "Forest Owl", text: "I stayed awake just to welcome you! Hoot!", expression: "happy" }]
      });

      // Bake Giant Cake
      entities.push({
        type: 'kingdom_cake',
        sprite: 'cupcake',
        x: 480,
        y: 550,
        size: 48,
        done: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.done) return [{ speaker: "Mochi", text: "What a massive cake! It looks delicious!" }];
          self.done = true;
          level.updateTask("giant_cake", 1);
          return [
            { speaker: "Mochi", text: "Mixing layers of strawberry cream and pastel frosting..." },
            { speaker: "Mochi", text: "Added 14 cherries on top! Finished!", expression: "happy" }
          ];
        }
      });

      // Prepare Streets
      entities.push({
        type: 'street_prep',
        sprite: 'tile_wood',
        x: 480,
        y: 350,
        size: 48,
        done: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.done) return [{ speaker: "Mochi", text: "The street is ready!" }];
          self.done = true;
          level.updateTask("celebration", 1);
          return [{ speaker: "Mochi", text: "Swept the lanes and cleared confetti arches. Ready!" }];
        }
      });

      // Hang 4 Banners
      for (let i = 0; i < 4; i++) {
        entities.push({
          type: 'banner',
          sprite: 'tile_dirt',
          x: 120 + i * 260,
          y: 100,
          size: 32,
          hung: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.hung) return;
            self.hung = true;
            level.updateTask("banners", 1);
            return [{ speaker: "Mochi", text: "Hung a big pastel banner. It says 'Welcome Home'!", expression: "happy" }];
          }
        });
      }

      // Plant 5 Heart Blossoms
      for (let i = 0; i < 5; i++) {
        entities.push({
          type: 'heart_blossom',
          sprite: 'flower_gray',
          x: 200 + i * 160,
          y: 450,
          size: 16,
          planted: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.planted) return;
            self.planted = true;
            self.sprite = 'flower_red';
            level.updateTask("kingdom_flowers", 1);
            return [{ speaker: "Mochi", text: "Planted the Heart Blossom! It glows soft red.", expression: "happy" }];
          }
        });
      }

      // Telescope Hidden Memory
      entities.push({
        type: 'hidden_memory',
        sprite: 'wish_bottle',
        x: 880,
        y: 420,
        size: 20,
        read: false,
        interactive: true,
        onInteract: (player, self) => {
          if (self.read) return;
          self.read = true;
          self.interactive = false;
          level.foundMemory = true;
          return [
            { speaker: "Mochi", text: "Looking through the balcony telescope at the moon..." },
            { speaker: "Telescope", text: "The moon briefly forms a glowing heart before fading." },
            { speaker: "Letter", text: "\"Some hearts always find each other. ❤️\"" },
            { speaker: "Mochi", text: "Welcome Home.", expression: "happy" }
          ];
        }
      });

      // Bench
      entities.push({
        type: 'bench',
        sprite: 'bench',
        x: 480,
        y: 200,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Mochi", text: "A royal bench adorned with red cushions." }]
      });

      return entities;
    }
  },

  // LEVEL 15: FINAL GARDEN
  {
    id: 15,
    name: "Final Garden",
    theme: "Home",
    tileType: "grass",
    skyColor: "#fce4ec",
    particles: "sakura",
    taskTemplate: [], // No tasks! Just a peaceful walk.
    generateLayout: (grid) => {
      // Peaceful meadow path down the middle
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          grid[r][c] = (r >= 10 && r <= 13) ? 'd' : 'g';
        }
      }
    },
    spawnEntities: (level) => {
      const entities = [];

      // A simple straight path showing items from all 14 past levels!
      const items = [
        'flower_red',   // 1
        'paper_boat',   // 2
        'mushroom',     // 3
        'flower_blue',  // 4
        'teacup',       // 5
        'star',         // 6
        'penguin',      // 7 (snowman/penguin)
        'star',         // 8
        'wish_bottle',  // 9 (paint)
        'flower_cherry',// 10
        'lantern',      // 11
        'cloud_spirit', // 12
        'lantern',      // 13
        'cupcake'       // 14
      ];

      items.forEach((itemSprite, idx) => {
        entities.push({
          type: 'milestone',
          sprite: itemSprite,
          x: 100 + idx * 60,
          y: 11 * TILE_SIZE + 10,
          size: 16,
          activated: false,
          interactive: true,
          onInteract: (player, self) => {
            if (self.activated) return;
            self.activated = true;
            self.interactive = false;
            // sparkle and fade
            self.x = -100;
            Particles.spawnSparkles(player.x, player.y, 10, PALETTE['pink']);
            Audio.playChime();
            return [{ speaker: "Mochi", text: `A beautiful echo of our journey...`, expression: "happy" }];
          }
        });
      });

      // The white butterfly leading you
      entities.push({
        type: 'guiding_butterfly',
        sprite: 'butterfly',
        x: 50,
        y: 11 * TILE_SIZE,
        size: 12,
        interactive: false
      });

      // The Memory Tree (At the end)
      entities.push({
        type: 'final_tree',
        sprite: 'tile_stone', // custom logic draws tree
        x: 940,
        y: 9 * TILE_SIZE,
        size: 64,
        interactive: true,
        dialogues: [
          { speaker: "Mochi", text: "We reached the fully restored Memory Tree!" }
        ]
      });

      // GF / Partner character waiting under tree
      entities.push({
        type: 'gf_character',
        sprite: 'player_gf',
        x: 980,
        y: 11 * TILE_SIZE,
        size: 24,
        interactive: true,
        dialogues: [
          { speaker: "Girlfriend", text: "You found every Memory Heart." },
          { speaker: "Girlfriend", text: "Every one brought back a beautiful memory." },
          { speaker: "Girlfriend", text: "But there was one thing the tree could never forget..." },
          { speaker: "Girlfriend", text: "...the person who made those memories worth keeping." }
        ]
      });

      // Benches are occupied
      entities.push({
        type: 'bench_occupied_1',
        sprite: 'bench',
        x: 300,
        y: 9 * TILE_SIZE,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Cat & Chick", text: "Sharing cupcakes and chatting happily!", expression: "happy" }]
      });

      entities.push({
        type: 'bench_occupied_2',
        sprite: 'bench',
        x: 600,
        y: 9 * TILE_SIZE,
        size: 48,
        interactive: true,
        dialogues: [{ speaker: "Duck & Owl", text: "Laughing under the warm sky.", expression: "happy" }]
      });

      return entities;
    }
  }
];

class ActiveLevel {
  constructor() {
    this.meta = null;
    this.grid = [];
    this.entities = [];
    this.tasks = [];
    this.completed = false;
    this.foundMemory = false;
  }

  load(levelId) {
    this.meta = LEVEL_DATA.find(l => l.id === levelId) || LEVEL_DATA[0];
    this.completed = false;
    this.foundMemory = false;

    // Initialize blank grid
    this.grid = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < MAP_COLS; c++) {
        this.grid[r][c] = 'g'; // default grass
      }
    }

    // Run layout generator
    this.meta.generateLayout(this.grid);

    // Initialize tasks list copy
    this.tasks = JSON.parse(JSON.stringify(this.meta.taskTemplate || []));

    // Spawn entities
    this.entities = this.meta.spawnEntities(this);
    
    // Clear and spawn fireflies or cherry blossoms globally in the level
    Particles.clear();
    const mapW = MAP_COLS * TILE_SIZE;
    const mapH = MAP_ROWS * TILE_SIZE;
    
    if (this.meta.particles === 'sakura') {
      Particles.spawnSakura(15, mapW, mapH, true);
    } else if (this.meta.particles === 'firefly') {
      Particles.spawnFirefly(25, mapW, mapH, true);
    } else if (this.meta.particles === 'bubble') {
      Particles.spawnDreamBubble(15, mapW, mapH, true);
    } else if (this.meta.particles === 'snow') {
      Particles.spawnSnow(30, mapW, mapH, true);
    }
  }

  updateTask(taskId, amt) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.current = Math.min(task.target, task.current + amt);
    Audio.playPop(); // short bubble sound feedback

    // Check level completion
    const allDone = this.tasks.every(t => t.current >= t.target);
    if (allDone && !this.completed) {
      this.completed = true;
    }
  }
}

export const LevelManager = new ActiveLevel();
export default LevelManager;
