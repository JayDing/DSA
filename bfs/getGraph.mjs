function getGraph(x) {
    // const ms = 1000;
    const ms = Math.random() * 3 * 1000;
    console.log(`getGraph(${x}) called, waiting ${ms}ms`);

    return new Promise(resolve => {
        setTimeout(function () {
            let node = [];
            if (x === 1) node = [2, 3, 4];
            if (x === 2 || x === 3) node = [5];
            if (x === 4) node = [6];
            if (x === 5 || x === 6) node = [7];
            console.log(`getGraph(${x}) returning`, node);
            resolve(node);
        }, ms);
    });
}

// 遞迴
async function searchGraph1(start, concurrency = 3) {
    const time = Date.now();
    const queue = [start];
    const visited = [start];

    let running = 0;
    return new Promise(resolve => {
        function next() {
            if (queue.length === 0 && running === 0) {
                console.log(`Search completed in ${Date.now() - time}ms`);

                return resolve(visited);
            }

            while (running < concurrency && queue.length > 0) {
                const node = queue.shift();
                running++;

                getGraph(node).then(children => {
                    for (const child of children) {
                        if (!visited.includes(child)) {
                            visited.push(child);
                            queue.push(child);
                        }
                    }

                    running--;
                    next();
                });
            }
        }

        next();
    });
}

// batch
async function searchGraph2(start, concurrency = 3) {
    const time = Date.now();
    const queue = [start];
    const visited = [start];

    while (queue.length > 0) {
        const batch = queue.splice(0, concurrency);
        const fetch = await Promise.all(batch.map(node => getGraph(node)));

        for (const children of fetch) {
            for (const child of children) {
                if (!visited.includes(child)) {
                    visited.push(child);
                    queue.push(child);
                }
            }
        }
    }

    console.log(`Search completed in ${Date.now() - time}ms`);

    return visited;
}

// worker pool
async function searchGraph3(start, concurrency = 3) {
    const time = Date.now();
    const queue = [start];
    const visited = [start];

    async function worker(idx, interval = 200, idleTimeout = 5000) {
        let lastActivity = Date.now();

        while (true) {
            // 檢查佇列是否有節點
            if (queue.length === 0) {
                // 如果佇列為空，檢查是否有活動
                if (Date.now() - lastActivity > idleTimeout) {
                    console.log(`Worker ${idx + 1} finished`);
                    return;
                }

                console.log(`Worker ${idx + 1} is idle, waiting for new tasks...`);
                await new Promise(resolve => setTimeout(resolve, interval)); // 等待一段時間再檢查佇列
                continue;
            }

            console.log(`Worker ${idx + 1} is active, processing...`);
            lastActivity = Date.now(); // 更新最後活動時間

            const node = queue.shift();
            const children = await getGraph(node);

            for (const child of children) {
                if (!visited.includes(child)) {
                    visited.push(child);
                    queue.push(child);
                }
            }

            console.log(`last completed: ${node}, time: ${Date.now() - time}ms`);
        }
    }

    await Promise.all(Array.from({ length: concurrency }, (v, idx) => worker(idx)));

    console.log(`Search completed in ${Date.now() - time}ms`);

    return visited;
}

async function asyncGraphQueueSequential(start) {
    const time = Date.now();
    const queue = [start];
    const visited = [];
    let index = 0;

    while (index < queue.length) {
        const node = queue[index];

        getGraph(node).then(children => {
            visited.push({ node, children, q: [...queue] });
            queue.push(...children.filter(child => !queue.includes(child)));
        });

        index++; // 移動到下一個節點
    }

    console.log(`Search completed in ${Date.now() - time}ms`);

    return visited;
}

const result1 = await searchGraph1(1);
console.log('Search results:', result1);

const result2 = await searchGraph2(1);
console.log('Search results:', result2);

const result3 = await searchGraph3(1);
console.log('Search results:', result3);

// const result4 = await asyncGraphQueueSequential(1);
// console.log('Search results:', result4);