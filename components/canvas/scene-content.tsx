// components/canvas/scene-content.tsx
"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  ContactShadows,
  useGLTF,
  Bvh,
} from "@react-three/drei";
import { useStore } from "@/store/use-store";
import { Manager } from "./manager";

export function SceneContent() {
  const { raycaster, camera, gl } = useThree();
  const addItem = useStore((state) => state.addItem);

  // 1. 加载模型（增加 true 参数开启挂起模式）
  const { scene } = useGLTF("/models/room.glb");

  // 2. 使用 useMemo 克隆模型并进行一次性配置，防止重复遍历
  const roomModel = useMemo(() => {
    const clonedScene = scene.clone();
    console.log("--- 房间模型初始化 ---");

    clonedScene.traverse((child) => {
      // 确保是 Mesh 类型
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        // 1. 获取材质
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        // 2. 遍历材质并设置精度
        materials.forEach((mat) => {
          // 使用 'in' 关键字检查属性是否存在，或者直接断言为 any
          // 这里推荐断言为 THREE.ShaderMaterial 或强制转换为具有 precision 的对象
          if (mat && "precision" in mat) {
            (mat as any).precision = "lowp";
          }
        });
      }
    });

    return clonedScene;
  }, [scene]);

  // 3. 修复阴影弃用警告并设置基础 GL 属性
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap; // 替换掉弃用的 PCFSoftShadowMap
  }, [gl]);

  // --- 新增：模型初始化配置 ---
  useEffect(() => {
    console.log("--- 房间模型结构扫描 ---");
    roomModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        // 打印所有组件名称，方便你以后根据名字锁定“地面”
        console.log("物体名称:", child.name);
        // 开启接收阴影，这样家具的阴影才会倒映在房间地板上
        child.receiveShadow = true;
        // 开启投射阴影，房间墙壁也能产生阴影（可选）
        child.castShadow = true;
      }
    });
  }, [roomModel]);

  useEffect(() => {
    window.addEventListener("canvas-drop", handleCanvasDrop);
    return () => window.removeEventListener("canvas-drop", handleCanvasDrop);
  }, [camera, gl, raycaster, addItem, roomModel]);

  // const handleCanvasDrop = (e: any) => {
  //   const { asset, clientX, clientY } = e.detail;

  //   // 1. 将屏幕坐标转为标准化设备坐标 (NDC)
  //   const rect = gl.domElement.getBoundingClientRect();
  //   const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  //   const y = -((clientY - rect.top) / rect.height) * 2 + 1;

  //   // 2. 更新射线
  //   const pointer = new THREE.Vector2(x, y);
  //   raycaster.setFromCamera(pointer, camera);

  //   // 3. 计算射线与地平面 (y=0) 的交点
  //   const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  //   const targetPos = new THREE.Vector3();

  //   if (raycaster.ray.intersectPlane(plane, targetPos)) {
  //     // 4. 在交点处添加家具
  //     addItem(asset, [targetPos.x, 0, targetPos.z]);
  //   }
  // };

  const handleCanvasDrop = (e: any) => {
    const { asset, clientX, clientY } = e.detail;
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // 仅与 roomModel 进行射线检测
    const intersects = raycaster.intersectObject(roomModel, true);

    if (intersects.length > 0) {
      const targetPos = intersects[0].point;
      addItem(asset, [targetPos.x, targetPos.y + 0.01, targetPos.z]);
    }
  };

  return (
    <>
      {/* 1. 灯光系统 */}
      {/* 环境光：它是“无死角”的光，提供基础亮度，防止背光面全黑。 */}
      <ambientLight intensity={1.0} />
      {/* 点光源：像一个灯泡，有具体位置，能产生阴影和高光。 */}
      <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />

      {/* 2. 把 3D 场景的底色直接改成和网页背景一样的深黑色 */}
      <color attach="background" args={["#090a0f"]} />

      {/* 使用 Bvh 包裹，大幅优化高面数模型的射线检测性能 */}
      <Bvh firstHitOnly>
        <primitive object={roomModel} />
      </Bvh>

      {/* 3. 核心逻辑：Manager 会根据 Zustand 的数据渲染模型。
          每个家具自己的加载状态在 item 级别处理，避免新增模型时整组场景一起闪烁。 */}
      <Manager />

      {/* 4. 辅助视觉：地板网格 */}
      <Grid
        infiniteGrid
        fadeDistance={30} // 渐变距离：网格不会在远处生硬地切断，而是在 30 个单位之外慢慢变淡直到透明，视觉上更自然
        sectionColor="green" // 大网格颜色：（每 10 个小格一条深色线）。这里用的 #2d3449 是深蓝色调
        cellColor="red" // 小网格颜色：稍微浅一点或深一点的 #1e2330，形成明暗对比
      />

      {/* 5. 软阴影：让家具“坐”在地上 */}
      <ContactShadows
        opacity={0.4} // 阴影的透明度
        scale={20} // 阴影投射的覆盖范围
        blur={2.4} // 模糊度：数值越高，阴影边缘越柔和，看起来像是在散射光照射下的效果
        far={4.5} // 检测距离：它决定了物体离地面多高时还能产生阴影。如果 far 太小，沙发离地 1 厘米阴影就消失了。
        color="#000000" // 阴影颜色：通常用黑色，但在某些特殊美术风格里可以调成深蓝色或深棕色。
      />

      {/* 6. 鼠标控制器：允许左键旋转、右键平移、滚轮缩放视图 */}
      {/* <OrbitControls makeDefault minDistance={2} maxDistance={15} /> */}
      <OrbitControls
        makeDefault
        // --- 新增限制 ---
        minDistance={2}
        maxDistance={12} // 防止缩得太小看不到房间
        // 极角限制：Math.PI/2 是水平看。这里限制在 0 到 1.5 之间，
        // 保证用户只能在房间上方俯瞰，不能转到地板下面看黑洞。
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.1}
        // 开启阻尼（惯性），旋转起来更顺滑，像专业装修软件
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}

useGLTF.preload("/models/room.glb");
