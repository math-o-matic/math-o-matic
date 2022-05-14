# /src/expr

```
Expr
 ├ Reduction
 ├ Conditional
 ├ $Variable
 ├ With
 ├ Fun
 ├ Funcall
 └ Variable
    └ Parameter
```

## types.ts

```
Type
 ├ SimpleType
 ├ FunctionalType
 └ ConditionalType
```

이름을 가질 수 있는 타입은 `SimpleType` 뿐이며 이것이 매크로로 정의되었을 경우 함수형 타입과 `Type#equals(Type)`으로 비교하였을 때 같아질 수 있다. 예를 들어 `SimpleType`인 `pr := [cls -> st]`는 `FunctionalType`인 `[cls -> st]`와 같다.
