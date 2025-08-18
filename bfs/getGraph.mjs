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

async function searchGraph(start, concurrency = 3) {
    const queue = [start];
    const visited = [];
    visited.push(start);

    let running = 0;
    return new Promise(resolve => {
        function next() {
            if (queue.length === 0 && running === 0) {
                resolve(visited);
                return;
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

async function asyncGraphQueueSequential(start) {
    const queue = [start];   // 初始化佇列
    const visited = [];          // 存每個節點結果
    let index = 0;               // 目前處理到佇列的位置

    while (index < queue.length) {
        const node = queue[index];

        getGraph(node).then(children => {
            visited.push({ node, children, q: [...queue] });
            queue.push(...children.filter(child => !queue.includes(child)));
        });
        // const children = await getGraph(node); // 等待非同步任務完成
        // results.push({ node, children, q: [...queue] });

        // 把子節點加入佇列
        // queue.push(...children.filter(child => !queue.includes(child)));
        index++; // 移動到下一個節點
    }

    return visited;
}

const time1 = Date.now();
const result1 = await searchGraph(1);
console.log(`Search completed in ${Date.now() - time1}ms`);
console.log('Search results:', result1);

const time2 = Date.now();
const result2 = await asyncGraphQueueSequential(1);
console.log(`Search completed in ${Date.now() - time2}ms`);
console.log('Search results:', result2);